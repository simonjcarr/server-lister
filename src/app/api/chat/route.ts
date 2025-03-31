import { NextRequest, NextResponse } from 'next/server';
// We don't need the TextEncoderStream implementation anymore
import { z } from 'zod';
import { db } from '@/db';
import { eq, gt, and } from 'drizzle-orm';
import { chatMessages, users } from '@/db/schema';
import { EventEmitter } from 'events';
import { auth } from '@/auth';
import { sendChatNotifications } from '@/app/actions/chat/notificationActions';

// Create a global event emitter for chat messages
const chatEventEmitter = new EventEmitter();
// Increase the max listeners to prevent memory leak warnings
chatEventEmitter.setMaxListeners(100);

// Send chat message to all connected clients
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate the request body
    const schema = z.object({
      message: z.string().min(1),
      chatRoomId: z.string().min(1),
      categoryId: z.number().int().positive(),
    });

    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { message, chatRoomId, categoryId } = result.data;
    const userId = session.user.id;

    // Insert message to database
    const now = new Date();
    // Ensure all required fields are non-null and of the right type
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const inserted = await db
      .insert(chatMessages)
      .values({
        userId: userId, // Ensure it's a string
        message,
        chatRoomId,
        categoryId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted.length) {
      return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
    }

    const newMessage = inserted[0];

    // Get the user information to include in the event
    const userInfo = await db
      .select({
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, userId))
      .then(results => results[0]);

    // Prepare the message to emit
    const chatMessage = {
      id: newMessage.id,
      userId: newMessage.userId,
      userName: userInfo?.name || 'Unknown User',
      userImage: userInfo?.image || undefined,
      message: newMessage.message,
      chatRoomId: newMessage.chatRoomId,
      categoryId: newMessage.categoryId,
      createdAt: newMessage.createdAt,
    };

    // Emit the message to all connected clients
    chatEventEmitter.emit('message', chatMessage);
    
    // Send notifications to users who have favorited this server or subscribed to collections
    await sendChatNotifications(chatMessage);

    return NextResponse.json(chatMessage);
  } catch (err) {
    console.error('Error creating chat message:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// SSE endpoint for receiving chat messages
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the chat room ID from URL params
    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const lastEventId = searchParams.get('lastEventId');

    if (!chatRoomId) {
      return NextResponse.json({ error: 'chatRoomId is required' }, { status: 400 });
    }

    // Create a text encoder stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Function to send an event
        const sendEvent = async (event: string, data: Record<string, unknown>) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (sendErr) {
            console.error('Error sending SSE event:', sendErr);
          }
        };

        // If lastEventId is provided, send any messages that occurred since then
        if (lastEventId && !isNaN(Number(lastEventId))) {
          const lastId = parseInt(lastEventId, 10);
          
          // Get messages newer than lastEventId for this chat room
          db.select({
            id: chatMessages.id,
            userId: chatMessages.userId,
            message: chatMessages.message,
            chatRoomId: chatMessages.chatRoomId,
            categoryId: chatMessages.categoryId,
            createdAt: chatMessages.createdAt,
          })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.chatRoomId, chatRoomId),
              gt(chatMessages.id, lastId)
            )
          )
          .orderBy(chatMessages.createdAt)
          .then(async (historicalMessages) => {
            // Get user details for each message
            for (const msg of historicalMessages) {
              const userInfo = await db
                .select({
                  name: users.name,
                  image: users.image,
                })
                .from(users)
                .where(eq(users.id, msg.userId))
                .then(results => results[0]);
                
              // Send each historical message
              await sendEvent('message', {
                id: msg.id,
                userId: msg.userId,
                userName: userInfo?.name || 'Unknown User',
                userImage: userInfo?.image || undefined,
                message: msg.message,
                chatRoomId: msg.chatRoomId,
                categoryId: msg.categoryId,
                createdAt: msg.createdAt,
              });
            }
          });
        }

        // Function to handle new messages
        const messageHandler = async (message: { chatRoomId: string; [key: string]: unknown }) => {
          // Only send messages for the requested chat room
          if (message.chatRoomId === chatRoomId) {
            await sendEvent('message', message);
          }
        };

        // Listen for new messages
        chatEventEmitter.on('message', messageHandler);

        // Send a ping every 30 seconds to keep the connection alive
        const pingInterval = setInterval(async () => {
          try {
            await sendEvent('ping', { time: new Date().toISOString() });
          } catch {
            clearInterval(pingInterval);
          }
        }, 30000);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          chatEventEmitter.off('message', messageHandler);
          clearInterval(pingInterval);
          controller.close();
        });
      }
    });

    // Return the readable stream as the response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (sseError) {
    console.error('Error setting up SSE:', sseError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
