import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// Map to hold active connections
const connections = new Map<string, ReadableStreamController<Uint8Array>>();

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  console.log(`SSE: New connection established for user ${userId}`);
  
  // Create a ping timer to keep the connection alive
  let pingInterval: NodeJS.Timeout | null = null;

  // Create a new ReadableStream that will be used for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this user
      connections.set(userId, controller);

      // Send an initial message to establish the connection
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('event: connected\ndata: {"connected": true}\n\n'));
      
      // Send a ping every 30 seconds to keep the connection alive
      pingInterval = setInterval(() => {
        try {
          console.log(`SSE: Sending ping to user ${userId}`);
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (error) {
          console.error(`SSE: Error sending ping to user ${userId}:`, error);
          clearInterval(pingInterval!);
          connections.delete(userId);
        }
      }, 30000);

      // When the connection is closed, clean up
      request.signal.addEventListener('abort', () => {
        console.log(`SSE: Connection closed for user ${userId}`);
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        connections.delete(userId);
      });
    },
    cancel() {
      console.log(`SSE: Connection cancelled for user ${userId}`);
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      connections.delete(userId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Prevents Nginx from buffering the response
    },
  });
}

// Helper function to send an event to a specific user
export function sendEventToUser(userId: string, event: string, data: any) {
  // Check if user has an active connection
  const controller = connections.get(userId);
  if (!controller) {
    console.log(`SSE: User ${userId} not connected, cannot send event`);
    return false;
  }
  
  // Send the event
  try {
    const encoder = new TextEncoder();
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
    console.log(`SSE: Event sent to user ${userId} successfully (payload length: ${payload.length})`);
    return true;
  } catch (error) {
    console.error(`SSE: Error sending event to user ${userId}:`, error);
    return false;
  }
}

// Helper function to send a notification event to all connected users
export function broadcastEvent(event: string, data: any) {
  let sentCount = 0;
  connections.forEach((controller, userId) => {
    try {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      sentCount++;
      console.log(`SSE: Broadcast event sent to user ${userId}`);
    } catch (error) {
      console.error(`SSE: Error broadcasting to user ${userId}:`, error);
      // Remove the connection if we can't send to it
      connections.delete(userId);
    }
  });
  console.log(`SSE: Broadcast to ${sentCount} users`);
  return sentCount;
}

// Debug function to see active connections
export function getConnectionsStatus() {
  return {
    activeConnections: connections.size,
    userIds: Array.from(connections.keys())
  };
}
