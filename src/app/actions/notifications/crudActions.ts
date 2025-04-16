'use server'
import db from "@/db/getdb"
import { notifications } from "@/db/schema"
import { eq, and, desc, inArray, count } from "drizzle-orm"
import { auth } from '@/auth'

export async function getUsersNotifications() {
    const session = await auth();
    if (!session) {
        throw new Error('unauthorized')
    }
    const userId = session.user.id;
    if (!userId) {
        throw new Error('unauthorized')
    }

    // Delete read notifications greater than 1 month old
    // await db.delete(notifications)
    //     .where(and(eq(notifications.userId, userId), eq(notifications.read, true), gte(notifications.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))));

    // Delete all notifications greater than 3 months old
    // await db.delete(notifications)
    //     .where(and(eq(notifications.userId, userId), gte(notifications.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))));
    const notificationsResult = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    return notificationsResult;
}

export async function getNotificationById(notificationId: number) {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }
    const userId = session.user.id;
    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }
    const notification = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)));
    return notification;
}

export async function markNotificationAsRead(notificationId: number) {
    const session = await auth();
    if (!session) {
        throw new Error('unauthorized')
    }
    const userId = session.user.id;
    if (!userId) {
        throw new Error('unauthorized')
    }
    const result = await db.update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId))).returning();
    return result;
}

export async function markNotificationAsUnread(notificationId: number) {
    const session = await auth();
    if (!session) {
        throw new Error('unauthorized')
    }
    const userId = session.user.id;
    if (!userId) {
        throw new Error('unauthorized')
    }
    const result = await db.update(notifications)
        .set({ read: false })
        .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId))).returning();
    return result
}

export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session) {
        throw new Error('unauthorized')
    }
    const userId = session.user.id;
    if (!userId) {
        throw new Error('unauthorized')
    }
    const result = await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId)).returning();
    return result
}

export async function markAllNotificationsAsUnread() {
    const session = await auth();
    if (!session) {
        throw new Error('unauthorized')
    }
    const userId = session.user.id;
    if (!userId) {
        throw new Error('unauthorized')
    }
    const result = await db.update(notifications)
        .set({ read: false })
        .where(eq(notifications.userId, userId)).returning();
    return result
}

export async function deleteNotifications(notificationIds: number[]) {
    const session = await auth()

    if(!session) {
        throw new Error('unauthorized')
    }
    const userId = session.user.id;
    if(!userId) {
        return { success: false, error: 'Unauthorized' };
    }
    await db.delete(notifications)
        .where(and(eq(notifications.userId, userId), inArray(notifications.id, notificationIds)));
    return
}

export async function getUnreadNotificationCount(userId: string) {
    const session = await auth()
    if(session?.user.id !== userId) {
        throw new Error('unauthorized')
    }
    const queryResult = await db.select({count: count()}).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return queryResult[0].count;
}