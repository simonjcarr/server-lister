// Helper functions and shared state for SSE notifications

// Map to hold active connections (shared between routes)
export const connections = new Map<string, ReadableStreamController<Uint8Array>>();

// Helper function to send an event to a specific user
export function sendEventToUser(userId: string, event: string, data: Record<string, unknown>) {
  const controller = connections.get(userId);
  if (!controller) {
    return false;
  }
  try {
    const encoder = new TextEncoder();
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
    return true;
  } catch {
    return false;
  }
}

// Helper function to send a notification event to all connected users
export function broadcastEvent(event: string, data: Record<string, unknown>) {
  let sentCount = 0;
  connections.forEach((controller, userId) => {
    try {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      sentCount++;
    } catch {
      // Remove the connection if we can't send to it
      connections.delete(userId);
    }
  });
  return sentCount;
}
