import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { respond, log, getUserId, getQueryParam } from "./utils.mjs";

const s3Client = new S3Client({ region: "ap-south-1" });
const BUCKET_NAME = process.env.BUCKET_NAME || "notestack-files-sandhiya";

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const fileKey = getQueryParam(event, "fileKey");

    if (!fileKey) {
      return respond(400, { error: "fileKey query parameter is required" });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    log("INFO", "Download URL generated", { userId, fileKey });
    return respond(200, { downloadUrl, fileKey });
  } catch (error) {
    log("ERROR", "GenerateDownloadUrl failed", { error: error.message });
    return respond(500, { error: "Failed to generate download URL" });
  }
}
