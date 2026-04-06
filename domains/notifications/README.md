# Notifications Domain

In-app notification system. Notifications are created by other domains (notes, sharing) and consumed by the frontend.

## DynamoDB Table
- **NoteStack-Notifications** — Partition: `userId`, Sort: `notificationId`

## Lambda Functions

| Function | Trigger | Description |
|---|---|---|
| GetNotifications | GET /notifications | Fetches latest 20 notifications for user, returns unread count |
| MarkNotificationRead | PUT /notifications | Marks single or all notifications as read |

## Notification Types
- `new_note` — Created by notes domain when a note is created
- `shared_note` — Created by sharing domain when a note is shared
