import { apiCall } from "../../shared/api-client";

export async function shareNote(noteId: string, sharedWithEmail: string) {
  return apiCall("POST", "/notes/share", { noteId, sharedWithEmail });
}
