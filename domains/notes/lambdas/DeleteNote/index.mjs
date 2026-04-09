import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { respond, log, getUserId, parseBody } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: "ap-south-1" });

const TABLE_NAME = process.env.NOTES_TABLE || "NoteStack-Notes";
const SHARED_TABLE = process.env.SHARED_TABLE || "NoteStack-SharedNotes";
const BUCKET_NAME = process.env.BUCKET_NAME || "notestack-files-YOURNAME";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { noteId } = body;

    if (!noteId) {
      return respond(400, { error: "noteId is required" });
    }

    // Delete note and get old values to check for file
    const result = await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId, noteId },
      ReturnValues: "ALL_OLD"
    }));

    if (!result.Attributes) {
      return respond(404, { error: "Note not found" });
    }

    // Delete file from S3 if it had one
    if (result.Attributes.fileKey) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: result.Attributes.fileKey
        }));
        log("INFO", "File deleted from S3", { fileKey: result.Attributes.fileKey });
      } catch (s3Error) {
        log("WARN", "Failed to delete file from S3", { error: s3Error.message });
      }
    }

    // Clean up shared note entries
    try {
      const sharedEntries = await docClient.send(new ScanCommand({
        TableName: SHARED_TABLE,
        FilterExpression: "noteId = :nid",
        ExpressionAttributeValues: { ":nid": noteId }
      }));

      for (const entry of (sharedEntries.Items || [])) {
        await docClient.send(new DeleteCommand({
          TableName: SHARED_TABLE,
          Key: {
            sharedWithUserId: entry.sharedWithUserId,
            noteId: entry.noteId
          }
        }));
      }
    } catch (shareError) {
      log("WARN", "Failed to clean up shared entries", { error: shareError.message });
    }

    log("INFO", "Note deleted", { userId, noteId });
    return respond(200, { message: "Note deleted", note: result.Attributes });
  } catch (error) {
    log("ERROR", "DeleteNote failed", { error: error.message });
    return respond(500, { error: "Failed to delete note" });
  }
}
