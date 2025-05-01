'use server'
import { db } from "@/db"
import { subTasks } from "@/db/schema"
import { eq } from "drizzle-orm"

// Accepts an array of subTask IDs in the new order
export const reorderSubTasks = async (orderedIds: number[]) => {
  const date = new Date()
  // Update each subTask's 'order' field to match its index in the array
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(subTasks)
      .set({ order: i, updatedAt: date })
      .where(eq(subTasks.id, orderedIds[i]))
  }
  return true
}
