import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendEventToUser } from '../../sse/notifications/route';

// Diagnostic endpoint to test SSE notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const testEvent = "notification";
    
    // Create a test notification
    const testNotification = {
      id: 999999,
      userId: userId,
      title: "Test Notification",
      message: "This is a test notification sent directly via the SSE test endpoint.",
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('TESTING: Sending test SSE notification to user', userId);
    
    // Try to send the event
    const success = sendEventToUser(userId, testEvent, testNotification);
    
    console.log('TESTING: SSE test notification status:', success ? 'SENT' : 'FAILED');

    return NextResponse.json({ 
      success, 
      message: success 
        ? 'Test notification sent successfully. Check client console for results.' 
        : 'Failed to send test notification. User may not have an active SSE connection.'
    });
  } catch (error) {
    console.error('Error in test SSE endpoint:', error);
    return NextResponse.json({ 
      error: 'Error sending test notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
