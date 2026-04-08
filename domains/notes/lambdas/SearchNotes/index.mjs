import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId, getQueryParam } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "NoteStack-Notes";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const query = getQueryParam(event, "q");

    if (!query || query.trim().length === 0) {
      return respond(400, { error: "Search query 'q' is required" });
    }

    const searchTerm = query.toLowerCase();

    // Query all user's notes then filter by title
    // (DynamoDB doesn't support CONTAINS in KeyConditionExpression)
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      FilterExpression: "contains(#t, :search)",
      ExpressionAttributeNames: { "#t": "title" },
      ExpressionAttributeValues: {
        ":uid": userId,
        ":search": searchTerm
      }
    }));

    const notes = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    log("INFO", "Search completed", { userId, query, resultCount: notes.length });
    return respond(200, { notes, query });
  } catch (error) {
    log("ERROR", "SearchNotes failed", { error: error.message });
    return respond(500, { error: "Failed to search notes" });
  }
}
