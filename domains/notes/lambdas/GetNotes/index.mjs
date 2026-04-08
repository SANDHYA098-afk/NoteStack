import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId, getQueryParam } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "NoteStack-Notes";
const SHARED_TABLE = "NoteStack-SharedNotes";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const category = getQueryParam(event, "category");
    const includeShared = getQueryParam(event, "shared");

    let params;

    if (category) {
      // Query using CategoryIndex GSI
      params = {
        TableName: TABLE_NAME,
        IndexName: "CategoryIndex",
        KeyConditionExpression: "userId = :uid AND category = :cat",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":cat": category
        }
      };
    } else {
      // Query all notes for user
      params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId
        }
      };
    }

    const result = await docClient.send(new QueryCommand(params));
    let notes = result.Items || [];

    // Also fetch shared notes if requested
    if (includeShared === "true") {
      const sharedResult = await docClient.send(new QueryCommand({
        TableName: SHARED_TABLE,
        KeyConditionExpression: "sharedWithUserId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId
        }
      }));

      const sharedNotes = (sharedResult.Items || []).map(note => ({
        ...note,
        isShared: true
      }));

      notes = [...notes, ...sharedNotes];
    }

    // Sort by createdAt descending (newest first)
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    log("INFO", "Notes retrieved", { userId, count: notes.length, category: category || "all" });
    return respond(200, { notes });
  } catch (error) {
    log("ERROR", "GetNotes failed", { error: error.message });
    return respond(500, { error: "Failed to retrieve notes" });
  }
}
