import { CONFIG } from "./config";
import { getToken } from "./auth";

export async function apiCall(method: string, path: string, body?: unknown) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(CONFIG.API_URL + path, options);

  if (response.status === 401) {
    throw new Error("Session expired");
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");

  return data;
}

export interface Note {
  userId: string;
  noteId: string;
  title: string;
  content: string;
  category: string;
  fileKey: string | null;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  sharedByUserId?: string;
}

export interface Notification {
  userId: string;
  notificationId: string;
  type: string;
  message: string;
  noteId: string;
  read: boolean;
  createdAt: string;
}

export async function getNotes(category?: string, includeShared?: boolean) {
  const params = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (includeShared) params.push("shared=true");
  const query = params.length > 0 ? "?" + params.join("&") : "";
  return apiCall("GET", `/notes${query}`);
}

export async function createNote(title: string, content: string, category: string, fileKey?: string | null) {
  return apiCall("POST", "/notes", { title, content, category, fileKey });
}

export async function updateNote(noteId: string, title: string, content: string, category: string) {
  return apiCall("PUT", "/notes", { noteId, title, content, category });
}

export async function deleteNote(noteId: string) {
  return apiCall("DELETE", "/notes", { noteId });
}

export async function searchNotes(query: string) {
  return apiCall("GET", `/notes/search?q=${encodeURIComponent(query)}`);
}

export async function getUploadUrl(fileName: string) {
  return apiCall("POST", "/notes/upload-url", { fileName });
}

export async function getDownloadUrl(fileKey: string) {
  return apiCall("GET", `/notes/download-url?fileKey=${encodeURIComponent(fileKey)}`);
}

export async function shareNote(noteId: string, sharedWithEmail: string) {
  return apiCall("POST", "/notes/share", { noteId, sharedWithEmail });
}

export async function getNotifications() {
  return apiCall("GET", "/notifications");
}

export async function markNotificationRead(notificationId?: string, markAll?: boolean) {
  return apiCall("PUT", "/notifications", markAll ? { markAll: true } : { notificationId });
}
