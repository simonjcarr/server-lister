import { db } from "@/db";
import { eq, or, sql } from "drizzle-orm";
import { users } from "@/db/schema";
import { createBulkNotifications, type DeliveryType } from '@/lib/notification/notificationService';

export async function POST(request: Request) {
  const { title, message, htmlMessage, roleNames, userIds, deliveryType = 'browser' }: 
  {
    title: string, 
    message: string, 
    htmlMessage?: string, 
    roleNames?: string[], 
    userIds?: string[], 
    deliveryType?: DeliveryType
  } = await request.json();
  
  // Roles is a json field with array of roles. Write a db query that select users that have the roles in the request array
  if((!roleNames || roleNames.length === 0) && (!userIds || userIds.length === 0)) {
    return new Response('You must provide at least one role or user as an array', { status: 400 });
  }

  const roleConditions = roleNames?.map(role => 
    sql`${users.roles}::jsonb ? ${role}::text`
  ) || [];

  const userConditions = userIds?.map(user => 
    eq(users.id, user)
  ) || [];

  const allConditions = [...roleConditions, ...userConditions];

  const usersResult = await db
    .select()
    .from(users)
    .where(or(...allConditions))
    .groupBy(users.id);

  // Use our streamlined notification service to handle delivery
  try {
    const notifications = await createBulkNotifications({
      title,
      message,
      htmlMessage,
      userIds: usersResult.map(user => user.id),
      deliveryType: deliveryType as DeliveryType
    });
    
    return Response.json(notifications);
  } catch (error) {
    console.error('Error creating notifications:', error);
    return new Response('Failed to create notifications', { status: 500 });
  }
}
