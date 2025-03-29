import { db } from "@/db";
import { eq, or, sql } from "drizzle-orm";
import { notifications, users } from "@/db/schema";

export async function POST(request: Request) {
  const { title, message, roleNames, userIds}: {title: string, message: string, roleNames?: string[], userIds?: string[]} = await request.json();
  
  console.log(`API: Creating notifications with title: "${title}" for roles: ${roleNames?.join(', ')} and users: ${userIds?.join(', ')}`);
  
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
    
  console.log(`API: Found ${usersResult.length} users to notify`);

  const errors: string[] = [];
  const createdNotifications = [];
  
  for (const user of usersResult) {
    try {
      console.log(`API: Creating notification for user ${user.id} (${user.email || 'no email'})`);
      const [notification] = await db.insert(notifications).values({
        userId: user.id,
        message,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        read: false
      }).returning();
      
      if (notification) {
        createdNotifications.push(notification);
      }
    } catch (error) {
      console.error(`API: Error creating notification for user ${user.id}:`, error);
      errors.push(`error creating notification for user ${user.id}`);
    }
  }
  
  console.log(`API: Created ${createdNotifications.length} notifications with ${errors.length} errors`);
  if (createdNotifications.length > 0) {
    console.log(`API: First notification:`, JSON.stringify(createdNotifications[0], null, 2));
  }

  // IMPORTANT: Return the notifications as a direct array for simplicity
  // This simpler format should be easier for the worker to process
  return Response.json(createdNotifications);
}
