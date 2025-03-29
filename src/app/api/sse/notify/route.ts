import { NextRequest, NextResponse } from 'next/server';
import { sendEventToUser } from '../notifications/route';

export async function POST(request: NextRequest) {
  try {
    const { userId, event, data } = await request.json();
    console.log(`SSE Notify API: Received request to notify user ${userId} with event ${event}`);

    if (!userId || !event) {
      console.log(`SSE Notify API: Missing required fields, userId: ${!!userId}, event: ${!!event}`);
      return NextResponse.json({ 
        error: 'Missing required fields',
        success: false
      }, { status: 400 });
    }

    // Log the data to see what we're trying to send
    console.log(`SSE Notify API: Notification data for user ${userId}:`, 
      typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data);

    const success = sendEventToUser(userId, event, data);
    console.log(`SSE Notify API: Sending event to user ${userId} ${success ? 'succeeded' : 'failed'}`);

    return NextResponse.json({ 
      success, 
      message: success 
        ? `Event sent to user ${userId}` 
        : `User ${userId} not connected or error sending event` 
    });
  } catch (error) {
    console.error('Error in SSE notify endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
