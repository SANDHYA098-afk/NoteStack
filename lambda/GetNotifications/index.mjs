import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId } from "../shared/utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "NoteStack-Notifications";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      },
      ScanIndexForward: false,
      Limit: 20
    }));

    const notifications = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    log("INFO", "Notifications retrieved", { userId, count: notifications.length, unreadCount });
    return respond(200, { notifications, unreadCount });
  } catch (error) {
    log("ERROR", "GetNotifications failed", { error: error.message });
    return respond(500, { error: "Failed to get notifications" });
  }
}
