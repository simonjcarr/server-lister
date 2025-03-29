# Deprecated Notification Components

The following components are no longer in use after the notification system overhaul
that replaced polling with Server-Sent Events (SSE):

- `NotificationCountBadge.tsx` - This component was used for showing notification counts in the user dropdown menu
- `ViewNotificationsModal.tsx` - This modal was used to display notifications in the user dropdown menu
- `NotificationTable.tsx` - This table was displayed in the notifications modal

These files can be safely deleted when convenient, as the notification system now uses
the Bell icon in the header with Server-Sent Events for real-time updates.
