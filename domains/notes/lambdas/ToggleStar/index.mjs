import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DeleteCommand, GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId, parseBody } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "NoteStack-StarredNotes";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { noteId } = body;

    if (!noteId) {
      return respond(400, { error: "noteId is required" });
    }

    // Check if already starred
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, noteId }
    }));

    if (existing.Item) {
      // Unstar
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId }
      }));
      log("INFO", "Note unstarred", { userId, noteId });
      return respond(200, { starred: false, noteId });
    } else {
      // Star
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId,
          noteId,
          starredAt: new Date().toISOString()
        }
      }));
      log("INFO", "Note starred", { userId, noteId });
      return respond(200, { starred: true, noteId });
    }
  } catch (error) {
    log("ERROR", "ToggleStar failed", { error: error.message });
    return respond(500, { error: "Failed to toggle star" });
  }
}
