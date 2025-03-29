import { SelectNotification } from "@/db/schema";

/**
 * Send a notification event to a specific user via Server-Sent Events
 * This helper function sends events directly to the API Route for SSE broadcasting
 */
export async function sendNotificationEvent(
  userId: string,
  notification: SelectNotification,
  options = { internal: false }
) {
  try {
    // For internal server-side calls (like from the BullMQ worker), we use direct HTTP requests
    if (options.internal) {
      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/sse/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          event: 'notification',
          data: notification,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification event: ${response.status} ${response.statusText}`);
      }
      
      return true;
    }
    
    // For client-side calls, we would typically use the fetch API directly, but SSE is one-way
    // So this branch is mainly for completeness, though unlikely to be used directly
    return false;
  } catch (error) {
    console.error('Error sending notification event:', error);
    return false;
  }
}
