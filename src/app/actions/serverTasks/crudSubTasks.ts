'use server'
import { db } from "@/db"
import { subTasks, users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const getServerSubTasks = async (taskId: number) => {
  const taskResults = await db.select().from(subTasks).leftJoin(users, eq(subTasks.assignedTo, users.id)).where(eq(subTasks.taskId, taskId))
  return taskResults
}

export const createSubTask = async (taskId: number, title: string, description: string) => {
  const date = new Date()
  const task = await db.insert(subTasks).values({
    taskId,
    title,
    description,
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

// Refactored to accept a single object argument for React Query compatibility
export const updateSubTask = async ({ subTaskId, assignedTo }: { subTaskId: number; assignedTo: string }) => {
  const date = new Date()
  const task = await db.update(subTasks).set({
    assignedTo,
    updatedAt: date,
  }).where(eq(subTasks.id, subTaskId)).returning()
  return task[0]
}
