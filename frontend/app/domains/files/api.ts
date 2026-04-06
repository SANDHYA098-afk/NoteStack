import { apiCall } from "../../shared/api-client";

export async function getUploadUrl(fileName: string) {
  return apiCall("POST", "/notes/upload-url", { fileName });
}

export async function getDownloadUrl(fileKey: string) {
  return apiCall("GET", `/notes/download-url?fileKey=${encodeURIComponent(fileKey)}`);
}
