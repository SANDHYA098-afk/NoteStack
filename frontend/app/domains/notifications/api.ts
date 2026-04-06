import { apiCall } from "../../shared/api-client";

export interface Notification {
  userId: string;
  notificationId: string;
  type: string;
  message: string;
  noteId: string;
  read: boolean;
  createdAt: string;
}

export async function getNotifications() {
  return apiCall("GET", "/notifications");
}

export async function markNotificationRead(notificationId?: string, markAll?: boolean) {
  return apiCall("PUT", "/notifications", markAll ? { markAll: true } : { notificationId });
}
