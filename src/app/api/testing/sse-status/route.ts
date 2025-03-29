// This is a diagnostic endpoint used for debugging SSE connections
// It's currently disabled for production use
// To re-enable, remove the comments below

/*
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getConnectionsStatus } from '../../sse/notifications/route';

// Diagnostic endpoint to check SSE connection status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow users with admin role to check status
    if (!session.user.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get SSE connection status
    const status = getConnectionsStatus();
    
    // Check if the current user is connected
    const isCurrentUserConnected = status.userIds.includes(session.user.id);

    return NextResponse.json({
      ...status,
      isCurrentUserConnected,
      currentUserId: session.user.id,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking SSE status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
*/
