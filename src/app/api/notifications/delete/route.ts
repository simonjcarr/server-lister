import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and, inArray } from 'drizzle-orm';
import { notifications } from '@/db/schema';
import { auth } from '@/auth';

// POST /api/notifications/delete - Delete multiple notifications by IDs
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Delete the specified notifications for the user
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          inArray(notifications.id, ids)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
