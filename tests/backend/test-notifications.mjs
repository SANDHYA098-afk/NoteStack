// Test: Notifications Logic
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockDynamoDB } from './mock-aws.mjs';

const TABLE_NAME = 'NoteStack-Notifications';

describe('Notifications Logic', () => {
  let db;

  beforeEach(() => {
    db = new MockDynamoDB();
    db.seedTable(TABLE_NAME, []);
  });

  it('should create a notification for a user', async () => {
    const notif = {
      userId: 'user-1',
      notificationId: `notif_${Date.now()}_abc`,
      type: 'new_note',
      message: 'test@example.com uploaded a new note: "AWS Guide" (lecture)',
      noteId: 'note_123',
      read: false,
      createdAt: new Date().toISOString()
    };

    await db.send({ constructor: { name: 'PutCommand' }, input: { TableName: TABLE_NAME, Item: notif } });

    const result = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': 'user-1' } }
    });

    assert.strictEqual(result.Items.length, 1);
    assert.strictEqual(result.Items[0].type, 'new_note');
    assert.strictEqual(result.Items[0].read, false);
  });

  it('should not notify the author of their own note', () => {
    const authorId = 'user-1';
    const allUsers = ['user-1', 'user-2', 'user-3'];
    const toNotify = allUsers.filter(uid => uid !== authorId);

    assert.strictEqual(toNotify.length, 2);
    assert.ok(!toNotify.includes('user-1'));
  });

  it('should return unread count', async () => {
    db.seedTable(TABLE_NAME, [
      { userId: 'user-1', notificationId: 'n1', read: false },
      { userId: 'user-1', notificationId: 'n2', read: true },
      { userId: 'user-1', notificationId: 'n3', read: false },
    ]);

    const result = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': 'user-1' } }
    });

    const unreadCount = result.Items.filter(n => !n.read).length;
    assert.strictEqual(unreadCount, 2);
  });

  it('should create shared_note notification', async () => {
    const notif = {
      userId: 'target-user',
      notificationId: `notif_${Date.now()}_def`,
      type: 'shared_note',
      message: 'sender@email.com shared a note with you: "IOT Notes"',
      noteId: 'note_456',
      read: false,
      createdAt: new Date().toISOString()
    };

    await db.send({ constructor: { name: 'PutCommand' }, input: { TableName: TABLE_NAME, Item: notif } });

    const result = await db.send({
      constructor: { name: 'QueryCommand' },
      input: { TableName: TABLE_NAME, ExpressionAttributeValues: { ':uid': 'target-user' } }
    });

    assert.strictEqual(result.Items[0].type, 'shared_note');
    assert.ok(result.Items[0].message.includes('shared a note'));
  });
});
