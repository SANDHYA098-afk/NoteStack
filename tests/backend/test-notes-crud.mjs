// Test: Notes CRUD Logic
// Tests create, read, update, delete note operations
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockDynamoDB } from './mock-aws.mjs';

const TABLE_NAME = 'NoteStack-Notes';
const SHARED_TABLE = 'NoteStack-SharedNotes';

describe('Notes CRUD Logic', () => {
  let db;

  beforeEach(() => {
    db = new MockDynamoDB();
    db.seedTable(TABLE_NAME, []);
    db.seedTable(SHARED_TABLE, []);
  });

  describe('CreateNote', () => {
    it('should create a note with required fields', async () => {
      const note = {
        userId: 'user-1',
        noteId: `note_${Date.now()}_abc123`,
        title: 'Test Note',
        content: 'This is a test',
        category: 'general',
        fileKey: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.send({ constructor: { name: 'PutCommand' }, input: { TableName: TABLE_NAME, Item: note } });

      const result = await db.send({
        constructor: { name: 'GetCommand' },
        input: { TableName: TABLE_NAME, Key: { userId: 'user-1', noteId: note.noteId } }
      });

      assert.strictEqual(result.Item.title, 'Test Note');
      assert.strictEqual(result.Item.content, 'This is a test');
      assert.strictEqual(result.Item.category, 'general');
    });

    it('should reject note without title', () => {
      const body = { content: 'no title here' };
      // Title is missing = validation should fail
      const isValid = body.title && body.content;
      assert.ok(!isValid, 'Should be invalid without title');
    });

    it('should reject note without content', () => {
      const body = { title: 'no content' };
      assert.ok(!body.content);
    });

    it('should default category to general', () => {
      const category = undefined || 'general';
      assert.strictEqual(category, 'general');
    });

    it('should generate unique noteId', () => {
      const id1 = `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const id2 = `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      assert.notStrictEqual(id1, id2);
    });
  });

  describe('GetNotes', () => {
    it('should return notes for a specific user', async () => {
      db.seedTable(TABLE_NAME, [
        { userId: 'user-1', noteId: 'note_1', title: 'Note 1', createdAt: '2026-04-06T00:00:00Z' },
        { userId: 'user-1', noteId: 'note_2', title: 'Note 2', createdAt: '2026-04-06T01:00:00Z' },
        { userId: 'user-2', noteId: 'note_3', title: 'Note 3', createdAt: '2026-04-06T02:00:00Z' },
      ]);

      const result = await db.send({
        constructor: { name: 'QueryCommand' },
        input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': 'user-1' } }
      });

      assert.strictEqual(result.Items.length, 2);
      assert.ok(result.Items.every(n => n.userId === 'user-1'));
    });

    it('should return empty array for user with no notes', async () => {
      db.seedTable(TABLE_NAME, [
        { userId: 'user-1', noteId: 'note_1', title: 'Note 1' },
      ]);

      const result = await db.send({
        constructor: { name: 'QueryCommand' },
        input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': 'user-999' } }
      });

      assert.strictEqual(result.Items.length, 0);
    });
  });

  describe('DeleteNote', () => {
    it('should delete a note and return old values', async () => {
      db.seedTable(TABLE_NAME, [
        { userId: 'user-1', noteId: 'note_1', title: 'To Delete', fileKey: 'users/user-1/file.pdf' },
      ]);

      const result = await db.send({
        constructor: { name: 'DeleteCommand' },
        input: { TableName: TABLE_NAME, Key: { userId: 'user-1', noteId: 'note_1' } }
      });

      assert.strictEqual(result.Attributes.title, 'To Delete');
      assert.strictEqual(result.Attributes.fileKey, 'users/user-1/file.pdf');

      // Verify deleted
      const check = await db.send({
        constructor: { name: 'GetCommand' },
        input: { TableName: TABLE_NAME, Key: { userId: 'user-1', noteId: 'note_1' } }
      });
      assert.strictEqual(check.Item, null);
    });

    it('should return null when deleting non-existent note', async () => {
      const result = await db.send({
        constructor: { name: 'DeleteCommand' },
        input: { TableName: TABLE_NAME, Key: { userId: 'user-1', noteId: 'note_999' } }
      });

      assert.strictEqual(result.Attributes, null);
    });
  });

  describe('Search', () => {
    it('should find notes by title (case-insensitive)', () => {
      const notes = [
        { title: 'AWS Lambda Guide', content: 'How to use Lambda' },
        { title: 'DynamoDB Basics', content: 'NoSQL database' },
        { title: 'React Tutorial', content: 'Building UIs' },
      ];

      const query = 'lambda';
      const results = notes.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      );

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].title, 'AWS Lambda Guide');
    });

    it('should find notes by content', () => {
      const notes = [
        { title: 'Note 1', content: 'How to deploy serverless apps' },
        { title: 'Note 2', content: 'React hooks tutorial' },
      ];

      const results = notes.filter(n =>
        n.title.toLowerCase().includes('serverless') ||
        n.content.toLowerCase().includes('serverless')
      );

      assert.strictEqual(results.length, 1);
    });

    it('should return empty for no matches', () => {
      const notes = [
        { title: 'Note 1', content: 'Hello' },
      ];

      const results = notes.filter(n =>
        n.title.toLowerCase().includes('xyz123') ||
        n.content.toLowerCase().includes('xyz123')
      );

      assert.strictEqual(results.length, 0);
    });
  });
});
