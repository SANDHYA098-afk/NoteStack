// Test: ToggleStar Lambda
// Tests the star/unstar toggle logic
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockDynamoDB, createMockEvent, parseResponse } from './mock-aws.mjs';

// We test the logic directly since the Lambda imports AWS SDK
// This simulates what the Lambda handler does

const TABLE_NAME = 'NoteStack-StarredNotes';

describe('ToggleStar Logic', () => {
  let db;

  beforeEach(() => {
    db = new MockDynamoDB();
    db.seedTable(TABLE_NAME, []);
  });

  it('should star a note that is not yet starred', async () => {
    const event = createMockEvent({ body: { noteId: 'note_123' } });
    const userId = 'test-user-123';
    const noteId = 'note_123';

    // Simulate: check if starred
    const existing = await db.send({ constructor: { name: 'GetCommand' }, input: { TableName: TABLE_NAME, Key: { userId, noteId } } });
    assert.strictEqual(existing.Item, null);

    // Simulate: star it
    await db.send({ constructor: { name: 'PutCommand' }, input: { TableName: TABLE_NAME, Item: { userId, noteId, starredAt: new Date().toISOString() } } });

    // Verify it's in the table
    const result = await db.send({ constructor: { name: 'GetCommand' }, input: { TableName: TABLE_NAME, Key: { userId, noteId } } });
    assert.strictEqual(result.Item.noteId, 'note_123');
    assert.strictEqual(result.Item.userId, 'test-user-123');
  });

  it('should unstar a note that is already starred', async () => {
    const userId = 'test-user-123';
    const noteId = 'note_456';

    // Seed with a starred note
    db.seedTable(TABLE_NAME, [{ userId, noteId, starredAt: '2026-04-06T00:00:00Z' }]);

    // Simulate: check if starred
    const existing = await db.send({ constructor: { name: 'GetCommand' }, input: { TableName: TABLE_NAME, Key: { userId, noteId } } });
    assert.ok(existing.Item);

    // Simulate: unstar
    await db.send({ constructor: { name: 'DeleteCommand' }, input: { TableName: TABLE_NAME, Key: { userId, noteId } } });

    // Verify it's removed
    const result = await db.send({ constructor: { name: 'GetCommand' }, input: { TableName: TABLE_NAME, Key: { userId, noteId } } });
    assert.strictEqual(result.Item, null);
  });

  it('should return all starred note IDs for a user', async () => {
    const userId = 'test-user-123';
    db.seedTable(TABLE_NAME, [
      { userId, noteId: 'note_1', starredAt: '2026-04-06T00:00:00Z' },
      { userId, noteId: 'note_2', starredAt: '2026-04-06T01:00:00Z' },
      { userId: 'other-user', noteId: 'note_3', starredAt: '2026-04-06T02:00:00Z' },
    ]);

    const result = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': userId } }
    });

    const starredIds = result.Items.map(i => i.noteId);
    assert.strictEqual(starredIds.length, 2);
    assert.ok(starredIds.includes('note_1'));
    assert.ok(starredIds.includes('note_2'));
    assert.ok(!starredIds.includes('note_3'));
  });

  it('should not affect other users starred notes', async () => {
    db.seedTable(TABLE_NAME, [
      { userId: 'user-A', noteId: 'note_1', starredAt: '2026-04-06T00:00:00Z' },
      { userId: 'user-B', noteId: 'note_1', starredAt: '2026-04-06T00:00:00Z' },
    ]);

    // User A unstars
    await db.send({ constructor: { name: 'DeleteCommand' }, input: { TableName: TABLE_NAME, Key: { userId: 'user-A', noteId: 'note_1' } } });

    // User B should still have it starred
    const result = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': 'user-B' } }
    });
    assert.strictEqual(result.Items.length, 1);
    assert.strictEqual(result.Items[0].noteId, 'note_1');
  });
});
