import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { log } from "./utils.mjs";

const dynamoClient = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: "ap-south-1" });

const TABLE_NAME = process.env.NOTES_TABLE || "NoteStack-Notes";
const SHARED_TABLE = process.env.SHARED_TABLE || "NoteStack-SharedNotes";
const BUCKET_NAME = process.env.BUCKET_NAME || "notestack-files-YOURNAME";
const MAX_AGE_DAYS = 30;

export async function handler(event) {
  log("INFO", "AutoDelete started", { maxAgeDays: MAX_AGE_DAYS });

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    // Scan for old notes
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "createdAt < :cutoff",
      ExpressionAttributeValues: {
        ":cutoff": cutoffISO
      }
    }));

    const oldNotes = result.Items || [];
    log("INFO", "Found old notes", { count: oldNotes.length, cutoffDate: cutoffISO });

    let deletedCount = 0;

    for (const note of oldNotes) {
      // Delete file from S3 if attached
      if (note.fileKey) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: note.fileKey
          }));
        } catch (s3Error) {
          log("WARN", "Failed to delete S3 file", { fileKey: note.fileKey, error: s3Error.message });
        }
      }

      // Delete from DynamoDB
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId: note.userId, noteId: note.noteId }
      }));

      // Clean up shared entries
      try {
        const sharedEntries = await docClient.send(new ScanCommand({
          TableName: SHARED_TABLE,
          FilterExpression: "noteId = :nid",
          ExpressionAttributeValues: { ":nid": note.noteId }
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
        log("WARN", "Failed to clean up shared entries", { noteId: note.noteId });
      }

      deletedCount++;
    }

    log("INFO", "AutoDelete completed", { deletedCount });
    return { statusCode: 200, body: JSON.stringify({ deletedCount }) };
  } catch (error) {
    log("ERROR", "AutoDelete failed", { error: error.message });
    throw error;
  }
}
