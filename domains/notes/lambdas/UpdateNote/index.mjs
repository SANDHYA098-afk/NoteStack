import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { respond, log, getUserId, parseBody } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.NOTES_TABLE || "NoteStack-Notes";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { noteId, title, content, category } = body;

    if (!noteId) {
      return respond(400, { error: "noteId is required" });
    }

    if (!title && !content && !category) {
      return respond(400, { error: "At least one field (title, content, category) is required" });
    }

    // Build dynamic update expression
    const expressionParts = [];
    const expressionValues = {};
    const expressionNames = {};

    if (title) {
      expressionParts.push("#t = :title");
      expressionValues[":title"] = title;
      expressionNames["#t"] = "title";
    }

    if (content) {
      expressionParts.push("#c = :content");
      expressionValues[":content"] = content;
      expressionNames["#c"] = "content";
    }

    if (category) {
      expressionParts.push("#cat = :category");
      expressionValues[":category"] = category;
      expressionNames["#cat"] = "category";
    }

    expressionParts.push("updatedAt = :now");
    expressionValues[":now"] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, noteId },
      UpdateExpression: "SET " + expressionParts.join(", "),
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0 && { ExpressionAttributeNames: expressionNames }),
      ReturnValues: "ALL_NEW"
    }));

    log("INFO", "Note updated", { userId, noteId });
    return respond(200, { message: "Note updated", note: result.Attributes });
  } catch (error) {
    log("ERROR", "UpdateNote failed", { error: error.message });
    return respond(500, { error: "Failed to update note" });
  }
}
