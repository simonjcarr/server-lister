'use server'
import { db } from "@/db"
import { tasks, subTasks, users } from "@/db/schema"
import { and, eq, or } from "drizzle-orm"
import { auth } from "@/auth"
import { sql } from "drizzle-orm";

export const getServerTasks = async (serverId: number) => {
  const session = await auth();
  const userId = session?.user?.id;
  const conditions = [eq(tasks.isPublic, true)];
  if (userId) {
    conditions.push(eq(tasks.userId, userId));
  }
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      isPublic: tasks.isPublic,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      taskCount: sql`(SELECT count(*) FROM ${subTasks} WHERE ${subTasks.taskId} = ${tasks.id})`.as('taskCount'),
      taskCompleteCount: sql`(SELECT count(*) FROM ${subTasks} WHERE ${subTasks.taskId} = ${tasks.id} AND ${subTasks.isComplete} = true)`.as('taskCompleteCount'),
      taskNotCompleteCount: sql`(SELECT count(*) FROM ${subTasks} WHERE ${subTasks.taskId} = ${tasks.id} AND ${subTasks.isComplete} = false)`.as('taskNotCompleteCount'),
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .innerJoin(users, eq(tasks.userId, users.id))
    .where(and(eq(tasks.serverId, serverId), or(...conditions)));
}

export const getTaskById = async (taskId: number) => {
  return db.select().from(tasks).innerJoin(users, eq(tasks.userId, users.id)).where(eq(tasks.id, taskId))
}

export const createServerAction = async (serverId: number, title: string, description: string, isPublic: boolean = true) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User is not authenticated");
  const now = new Date();
  return await db.insert(tasks).values({
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
  const action = await db.select().from(tasks).where(eq(tasks.id, id))
  if (!action[0]) throw new Error("Action not found")
  const filter = []
  if (!action[0].isPublic) filter.push(eq(tasks.userId, userId))
  
  // Build the conditions
  const conditions = [eq(tasks.id, id), ...filter]

  return await db.update(tasks).set({
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
  const action = await db.select().from(tasks).where(eq(tasks.id, id))
  if (!action[0]) throw new Error("Action not found")
  const filter = []
  if (!action[0].isPublic) filter.push(eq(tasks.userId, userId))
  
  // Build the conditions
  const conditions = [eq(tasks.id, id), ...filter]

  const result = await db.delete(tasks).where(and(...conditions));
  return result;
}