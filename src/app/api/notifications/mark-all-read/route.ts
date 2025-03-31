import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { notifications } from '@/db/schema';
import { auth } from '@/auth';

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update all unread notifications for the user
    await db
      .update(notifications)
      .set({
        read: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.read, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
