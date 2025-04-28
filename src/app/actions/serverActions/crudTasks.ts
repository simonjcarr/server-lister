import { db } from "@/db"
import { tasks } from "@/db/schema"
import { eq } from "drizzle-orm"

export const getServerActionTasks = async (actionId: number) => {
  const taskResults = await db.select().from(tasks).where(eq(tasks.actionId, actionId))
  return taskResults
}