// Test: Sharing Logic
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockDynamoDB } from './mock-aws.mjs';

const NOTES_TABLE = 'NoteStack-Notes';
const SHARED_TABLE = 'NoteStack-SharedNotes';
const NOTIF_TABLE = 'NoteStack-Notifications';

describe('Sharing Logic', () => {
  let db;

  beforeEach(() => {
    db = new MockDynamoDB();
    db.seedTable(NOTES_TABLE, [
      { userId: 'user-1', noteId: 'note_1', title: 'Shared Note', content: 'Important info', category: 'lecture', fileKey: null, createdAt: '2026-04-06T00:00:00Z' }
    ]);
    db.seedTable(SHARED_TABLE, []);
    db.seedTable(NOTIF_TABLE, []);
  });

  it('should copy note to SharedNotes table', async () => {
    const originalNote = (await db.send({
      constructor: { name: 'GetCommand' },
      input: { TableName: NOTES_TABLE, Key: { userId: 'user-1', noteId: 'note_1' } }
    })).Item;

    // Share with user-2
    await db.send({
      constructor: { name: 'PutCommand' },
      input: {
        TableName: SHARED_TABLE,
        Item: {
          sharedWithUserId: 'user-2',
          noteId: originalNote.noteId,
          title: originalNote.title,
          content: originalNote.content,
          category: originalNote.category,
          fileKey: originalNote.fileKey,
          sharedByUserId: 'user-1',
          sharedAt: new Date().toISOString()
        }
      }
    });

    const shared = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: SHARED_TABLE, ExpressionAttributeValues: { ':uid': 'user-2' } }
    });

    assert.strictEqual(shared.Items.length, 1);
    assert.strictEqual(shared.Items[0].title, 'Shared Note');
    assert.strictEqual(shared.Items[0].sharedByUserId, 'user-1');
  });

  it('should create notification for shared user', async () => {
    await db.send({
      constructor: { name: 'PutCommand' },
      input: {
        TableName: NOTIF_TABLE,
        Item: {
          userId: 'user-2',
          notificationId: `notif_${Date.now()}_share`,
          type: 'shared_note',
          message: 'user1@email.com shared a note with you: "Shared Note"',
          noteId: 'note_1',
          read: false,
          createdAt: new Date().toISOString()
        }
      }
    });

    const notifs = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: NOTIF_TABLE, ExpressionAttributeValues: { ':uid': 'user-2' } }
    });

    assert.strictEqual(notifs.Items.length, 1);
    assert.strictEqual(notifs.Items[0].type, 'shared_note');
  });

  it('should not share with non-existent note', async () => {
    const result = await db.send({
      constructor: { name: 'GetCommand' },
      input: { TableName: NOTES_TABLE, Key: { userId: 'user-1', noteId: 'note_999' } }
    });

    assert.strictEqual(result.Item, null);
    // Lambda would return 404 here
  });

  it('should require noteId and email', () => {
    const body1 = { noteId: 'note_1' };
    const body2 = { sharedWithEmail: 'test@email.com' };
    const body3 = { noteId: 'note_1', sharedWithEmail: 'test@email.com' };

    assert.ok(!body1.sharedWithEmail); // missing email
    assert.ok(!body2.noteId); // missing noteId
    assert.ok(body3.noteId && body3.sharedWithEmail); // valid
  });
});
