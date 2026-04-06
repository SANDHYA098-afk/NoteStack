import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { respond, log, getUserId, parseBody } from "../shared/utils.mjs";

const s3Client = new S3Client({ region: "ap-south-1" });
const secretsClient = new SecretsManagerClient({ region: "ap-south-1" });

let cachedSecrets = null;

async function getSecrets() {
  if (cachedSecrets) return cachedSecrets;
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: "notestack/config" })
  );
  cachedSecrets = JSON.parse(response.SecretString);
  return cachedSecrets;
}

export async function handler(event) {
  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: "Unauthorized" });

    const body = parseBody(event);
    const { fileName } = body;

    if (!fileName) {
      return respond(400, { error: "fileName is required" });
    }

    const secrets = await getSecrets();
    const ext = fileName.split(".").pop().toLowerCase();

    if (!secrets.ALLOWED_FILE_TYPES.includes(ext)) {
      return respond(400, {
        error: `File type .${ext} is not allowed. Allowed: ${secrets.ALLOWED_FILE_TYPES.join(", ")}`
      });
    }

    const fileKey = `users/${userId}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: secrets.BUCKET_NAME,
      Key: fileKey
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    log("INFO", "Upload URL generated", { userId, fileKey });
    return respond(200, { uploadUrl, fileKey });
  } catch (error) {
    log("ERROR", "GenerateUploadUrl failed", { error: error.message });
    return respond(500, { error: "Failed to generate upload URL" });
  }
}
