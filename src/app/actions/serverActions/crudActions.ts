'use server'
import { db } from "@/db"
import { actions, users } from "@/db/schema"
import { and, eq, or } from "drizzle-orm"
import { auth } from "@/auth"

export const getServerActions = async (serverId: number) => {
  const session = await auth();
  const userId = session?.user?.id;
  const conditions = [eq(actions.isPublic, true)];
  if (userId) {
    conditions.push(eq(actions.userId, userId));
  }
  return db
    .select({
      id: actions.id,
      title: actions.title,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      createdAt: actions.createdAt,
      updatedAt: actions.updatedAt,
    })
    .from(actions)
    .innerJoin(users, eq(actions.userId, users.id))
    .where(and(eq(actions.serverId, serverId), or(...conditions)));
}