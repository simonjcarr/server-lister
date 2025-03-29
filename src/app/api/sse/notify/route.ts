import { NextRequest, NextResponse } from 'next/server';
import { sendEventToUser } from '../notifications/route';

export async function POST(request: NextRequest) {
  try {
    const { userId, event, data } = await request.json();

    if (!userId || !event) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        success: false
      }, { status: 400 });
    }

    const success = sendEventToUser(userId, event, data);

    return NextResponse.json({ 
      success, 
      message: success 
        ? `Event sent to user ${userId}` 
        : `User ${userId} not connected or error sending event` 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
