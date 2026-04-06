import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { respond, log, getUserId, parseBody } from "../../../../shared/utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({ region: "ap-south-1" });

const TABLE_NAME = "NoteStack-Notes";
const NOTIFICATIONS_TABLE = "NoteStack-Notifications";
let cachedSecrets = null;

async function getSecrets() {
  if (cachedSecrets) return cachedSecrets;
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: "notestack/config" })
  );
  cachedSecrets = JSON.parse(response.SecretString);
  return cachedSecrets;
}

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { title, content, category, fileKey } = body;

    if (!title || !content) {
      return respond(400, { error: "Title and content are required" });
    }

    // Validate file type if file is attached
    if (fileKey) {
      const secrets = await getSecrets();
      const ext = fileKey.split(".").pop().toLowerCase();
      if (!secrets.ALLOWED_FILE_TYPES.includes(ext)) {
        return respond(400, { error: `File type .${ext} is not allowed. Allowed: ${secrets.ALLOWED_FILE_TYPES.join(", ")}` });
      }
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const item = {
      userId,
      noteId,
      title,
      content,
      category: category || "general",
      fileKey: fileKey || null,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    // Notify all other users about the new note
    try {
      const userEmail = event.requestContext?.authorizer?.claims?.email || "Someone";
      // Scan for unique userIds in the Notes table (lightweight for small user base)
      const allNotes = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: "userId",
      }));
      const uniqueUserIds = [...new Set((allNotes.Items || []).map(n => n.userId))];

      for (const targetUserId of uniqueUserIds) {
        if (targetUserId === userId) continue; // Don't notify yourself
        await docClient.send(new PutCommand({
          TableName: NOTIFICATIONS_TABLE,
          Item: {
            userId: targetUserId,
            notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            type: "new_note",
            message: `${userEmail} uploaded a new note: "${title}" (${category || "general"})`,
            noteId,
            read: false,
            createdAt: now
          }
        }));
      }
    } catch (notifError) {
      log("WARN", "Failed to send notifications", { error: notifError.message });
    }

    log("INFO", "Note created", { userId, noteId, category: item.category });
    return respond(201, { message: "Note created", note: item });
  } catch (error) {
    log("ERROR", "CreateNote failed", { error: error.message });
    return respond(500, { error: "Failed to create note" });
  }
}
