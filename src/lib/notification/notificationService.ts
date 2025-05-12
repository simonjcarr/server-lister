import { queueEmail } from '../email/emailQueue';
import { sendNotificationEvent } from '../sse';
import db from '@/db/getdb';
import { notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type DeliveryType = 'browser' | 'email' | 'both';

interface NotificationOptions {
  title: string;
  message: string;
  htmlMessage?: string; // Optional HTML message for email
  userId: string;
  deliveryType: DeliveryType;
}

interface BulkNotificationOptions {
  title: string;
  message: string;
  htmlMessage?: string; // Optional HTML message for email
  userIds: string[];
  roleNames?: string[];
  deliveryType: DeliveryType;
}

/**
 * Create a notification and deliver it based on the specified delivery type
 */
export async function createNotification(options: NotificationOptions) {
  const now = new Date();
  // Use a regular object that will be stored as JSON in the database
  const deliveryStatus: Record<string, unknown> = {};
  
  // Insert notification into database
  const [notification] = await db
    .insert(notifications)
    .values({
      title: options.title,
      message: options.message,
      htmlMessage: options.htmlMessage || null,
      userId: options.userId,
      deliveryType: options.deliveryType,
      deliveryStatus,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Process delivery based on type
  if (['browser', 'both'].includes(options.deliveryType)) {
    // Send browser notification via SSE
    try {
      // Cast notification to ensure type compatibility with Json type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sendNotificationEvent(options.userId, notification as any, { internal: true });
      deliveryStatus['browser'] = { sent: true, sentAt: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to send browser notification:', error);
      deliveryStatus['browser'] = { sent: false, error: (error as Error).message };
    }
  }

  if (['email', 'both'].includes(options.deliveryType)) {
    // Send email notification
    try {
      // Get user's email
      const user = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, options.userId))
        .then(results => results[0]);

      if (user?.email) {
        // Queue email
        const emailData = {
          to: user.email,
          subject: options.title,
          text: options.message,
          html: options.htmlMessage || options.message, // Use HTML message if provided, otherwise use plain text
        };
        
        const jobId = await queueEmail(emailData);
        deliveryStatus['email'] = { queued: true, jobId, queuedAt: new Date().toISOString() };
      } else {
        deliveryStatus['email'] = { sent: false, error: 'User email not found' };
      }
    } catch (error) {
      console.error('Failed to queue email notification:', error);
      deliveryStatus['email'] = { sent: false, error: (error as Error).message };
    }
  }

  // Update delivery status
  if (Object.keys(deliveryStatus).length > 0) {
    await db
      .update(notifications)
      .set({ deliveryStatus: deliveryStatus })
      .where(eq(notifications.id, notification.id));
  }

  return notification;
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(options: BulkNotificationOptions) {
  const createdNotifications = [];
  
  // Process user IDs
  if (options.userIds && options.userIds.length > 0) {
    for (const userId of options.userIds) {
      const notification = await createNotification({
        title: options.title,
        message: options.message,
        htmlMessage: options.htmlMessage,
        userId,
        deliveryType: options.deliveryType,
      });
      createdNotifications.push(notification);
    }
  }

  // Process role names (requires users table to have a roles column or relationship)
  if (options.roleNames && options.roleNames.length > 0) {
    // This is a placeholder - implement based on your actual role structure
    // For example, if you have a roles table and user_roles junction table
    // You would query for users with those roles and send notifications to them
    
    // Example (modify based on your actual schema):
    /*
    const usersWithRoles = await db.query.users.findMany({
      where: inArray(users.role, options.roleNames),
      columns: { id: true }
    });
    
    for (const user of usersWithRoles) {
      const notification = await createNotification({
        title: options.title,
        message: options.message,
        htmlMessage: options.htmlMessage,
        userId: user.id,
        deliveryType: options.deliveryType,
      });
      createdNotifications.push(notification);
    }
    */
  }

  return createdNotifications;
}
