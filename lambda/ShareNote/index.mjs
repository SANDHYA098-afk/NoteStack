import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { respond, log, getUserId, parseBody } from "../shared/utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-south-1" });

const NOTES_TABLE = "NoteStack-Notes";
const NOTIFICATIONS_TABLE = "NoteStack-Notifications";
const SHARED_TABLE = "NoteStack-SharedNotes";
const USER_POOL_ID = process.env.USER_POOL_ID || "ap-south-1_EM3m76UWV";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { noteId, sharedWithEmail } = body;

    if (!noteId || !sharedWithEmail) {
      return respond(400, { error: "noteId and sharedWithEmail are required" });
    }

    // Get the original note to verify ownership
    const noteResult = await docClient.send(new GetCommand({
      TableName: NOTES_TABLE,
      Key: { userId, noteId }
    }));

    if (!noteResult.Item) {
      return respond(404, { error: "Note not found" });
    }

    // Look up the target user by email in Cognito
    const usersResult = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${sharedWithEmail}"`,
      Limit: 1
    }));

    if (!usersResult.Users || usersResult.Users.length === 0) {
      return respond(404, { error: "User not found with that email" });
    }

    const targetUserId = usersResult.Users[0].Username;

    // Save to SharedNotes table
    const note = noteResult.Item;
    await docClient.send(new PutCommand({
      TableName: SHARED_TABLE,
      Item: {
        sharedWithUserId: targetUserId,
        noteId,
        title: note.title,
        content: note.content,
        category: note.category,
        fileKey: note.fileKey,
        sharedByUserId: userId,
        createdAt: note.createdAt,
        sharedAt: new Date().toISOString()
      }
    }));

    // Notify the target user
    try {
      const userEmail = event.requestContext?.authorizer?.claims?.email || "Someone";
      await docClient.send(new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: {
          userId: targetUserId,
          notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          type: "shared_note",
          message: `${userEmail} shared a note with you: "${note.title}"`,
          noteId,
          read: false,
          createdAt: new Date().toISOString()
        }
      }));
    } catch (notifError) {
      log("WARN", "Failed to send notification", { error: notifError.message });
    }

    log("INFO", "Note shared", { userId, noteId, sharedWithEmail });
    return respond(200, { message: `Note shared with ${sharedWithEmail}` });
  } catch (error) {
    log("ERROR", "ShareNote failed", { error: error.message });
    return respond(500, { error: "Failed to share note" });
  }
}
