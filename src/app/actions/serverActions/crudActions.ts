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

export const createServerAction = async (serverId: number, title: string, description: string, isPublic: boolean = true) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User is not authenticated");
  const now = new Date();
  return await db.insert(actions).values({
    serverId,
    title,
    description,
    userId,
    isPublic,
    createdAt: now,
    updatedAt: now,
  }).returning();
}

export const updateServerAction = async (id: number, title: string, description: string, isPublic: boolean = true) => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("User is not authenticated")
  const now = new Date()

  // Check if the action is private and if it is create a rule to ensure only the owner can update the action
  const action = await db.select().from(actions).where(eq(actions.id, id))
  if (!action[0]) throw new Error("Action not found")
  const filter = []
  if (!action[0].isPublic) filter.push(eq(actions.userId, userId))
  
  // Build the conditions
  const conditions = [eq(actions.id, id), ...filter]

  return await db.update(actions).set({
    title,
    description,
    isPublic,
    updatedAt: now,
  }).where(and(...conditions));
}

export const deleteServerAction = async (id: number) => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("User is not authenticated")
  
  // Check if the action is private and if it is create a rule to ensure only the owner can delete the action
  const action = await db.select().from(actions).where(eq(actions.id, id))
  if (!action[0]) throw new Error("Action not found")
  const filter = []
  if (!action[0].isPublic) filter.push(eq(actions.userId, userId))
  
  // Build the conditions
  const conditions = [eq(actions.id, id), ...filter]

  const result = await db.delete(actions).where(and(...conditions));
  return result;
}