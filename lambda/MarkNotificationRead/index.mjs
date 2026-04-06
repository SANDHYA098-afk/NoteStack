import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId, parseBody } from "../shared/utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "NoteStack-Notifications";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { notificationId, markAll } = body;

    if (markAll) {
      // Query all unread and mark them
      const { QueryCommand } = await import("@aws-sdk/lib-dynamodb");
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :uid",
        FilterExpression: "attribute_not_exists(#r) OR #r = :false",
        ExpressionAttributeNames: { "#r": "read" },
        ExpressionAttributeValues: { ":uid": userId, ":false": false }
      }));

      for (const item of (result.Items || [])) {
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { userId, notificationId: item.notificationId },
          UpdateExpression: "SET #r = :true",
          ExpressionAttributeNames: { "#r": "read" },
          ExpressionAttributeValues: { ":true": true }
        }));
      }

      log("INFO", "All notifications marked read", { userId, count: (result.Items || []).length });
      return respond(200, { message: "All notifications marked as read" });
    }

    if (!notificationId) {
      return respond(400, { error: "notificationId or markAll is required" });
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, notificationId },
      UpdateExpression: "SET #r = :true",
      ExpressionAttributeNames: { "#r": "read" },
      ExpressionAttributeValues: { ":true": true }
    }));

    log("INFO", "Notification marked read", { userId, notificationId });
    return respond(200, { message: "Notification marked as read" });
  } catch (error) {
    log("ERROR", "MarkNotificationRead failed", { error: error.message });
    return respond(500, { error: "Failed to mark notification" });
  }
}
