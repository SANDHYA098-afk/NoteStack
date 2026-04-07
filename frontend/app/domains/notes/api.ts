import { apiCall } from "../../shared/api-client";

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
  authorEmail?: string;
}

export async function getFeedNotes(category?: string, query?: string) {
  const params = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (query) params.push(`q=${encodeURIComponent(query)}`);
  const qs = params.length > 0 ? "?" + params.join("&") : "";
  return apiCall("GET", `/notes/feed${qs}`);
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
