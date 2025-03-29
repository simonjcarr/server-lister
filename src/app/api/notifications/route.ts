import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { notifications } from '@/db/schema';
import { auth } from '@/auth';

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
