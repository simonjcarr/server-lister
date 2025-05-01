import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connections } from './helpers';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  
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
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }
          connections.delete(userId);
        }
      }, 30000);

      // When the connection is closed, clean up
      request.signal.addEventListener('abort', () => {
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        connections.delete(userId);
      });
    },
    cancel() {
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
