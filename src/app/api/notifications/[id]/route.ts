import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { notifications } from '@/db/schema';
import { auth } from '@/auth';

// PATCH /api/notifications/[id] - Mark a notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const body = await request.json();
    
    // Update the notification
    const updated = await db
      .update(notifications)
      .set({
        read: body.read === true, // Ensure boolean value
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: 'Notification not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    // Delete the notification
    const deleted = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      )
      .returning();

    if (!deleted.length) {
      return NextResponse.json(
        { error: 'Notification not found or not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
