'use server'
import { db } from "@/db"
import { subTasks, users } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export const getServerSubTasks = async (taskId: number) => {
  const taskResults = await db.select().from(subTasks).leftJoin(users, eq(subTasks.assignedTo, users.id)).where(eq(subTasks.taskId, taskId)).orderBy(asc(subTasks.order), asc(subTasks.createdAt))
  return taskResults
}

export const createSubTask = async (taskId: number, title: string, description: string) => {
  const date = new Date()
  const task = await db.insert(subTasks).values({
    taskId,
    title,
    description,
    order: 999,
    isComplete: false,
    createdAt: date,
    updatedAt: date,
  }).returning()
  return task[0]
}

export const toggleSubTaskComplete = async (subTaskId: number) => {
  // Get the current task
  const originalTask = await db.select().from(subTasks).where(eq(subTasks.id, subTaskId))
  
  // update the task and toggle the isComplete field
  const date = new Date()
  const task = await db.update(subTasks).set({
    isComplete: !originalTask[0].isComplete,
    updatedAt: date,
  }).where(eq(subTasks.id, subTaskId)).returning()
  return task[0]
}

// Expanded to allow editing title, description, and assignedTo
export const updateSubTask = async ({ subTaskId, title, description, assignedTo }: { subTaskId: number; title?: string; description?: string; assignedTo?: string }) => {
  const date = new Date()
  // Build the update object dynamically
  const updateObj: Record<string, unknown> = { updatedAt: date }
  if (title !== undefined) updateObj.title = title
  if (description !== undefined) updateObj.description = description
  if (assignedTo !== undefined) updateObj.assignedTo = assignedTo
  const task = await db.update(subTasks).set(updateObj).where(eq(subTasks.id, subTaskId)).returning()
  return task[0]
}
