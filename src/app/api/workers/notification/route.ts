import { db } from "@/db";
import { eq, or, sql } from "drizzle-orm";
import { notifications, users } from "@/db/schema";
export async function POST(request: Request) {
  
  const { title, message, roleNames, userIds}: {title: string, message: string, roleNames?: string[], userIds?: []} = await request.json();
  // Roles is a json field with array of roles. Write a db query that select users that have the roles in the request array
  if((!roleNames || roleNames.length === 0) && (!userIds || userIds.length === 0)) {
    return new Response('You must provide at least one role or user as an array', { status: 400 })
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

  const errors: string[] = [];
  for (const user of usersResult) {
    try {
      await db.insert(notifications).values({
        userId: user.id,
        message,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        read: false
      })
    } catch {
      console.error(`error creating notification for user ${user.id}`);
      errors.push(`error creating notification for user ${user.id}`);
    }
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ errors }), { status: 500 });
  }
  return new Response('Notifications sent successfully', { status: 200 });
}