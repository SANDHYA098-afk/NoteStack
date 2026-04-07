import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId } from "../../../../shared/utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "NoteStack-StarredNotes";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    }));

    const starredIds = (result.Items || []).map(item => item.noteId);

    log("INFO", "Starred notes retrieved", { userId, count: starredIds.length });
    return respond(200, { starredIds });
  } catch (error) {
    log("ERROR", "GetStarredNotes failed", { error: error.message });
    return respond(500, { error: "Failed to get starred notes" });
  }
}
