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