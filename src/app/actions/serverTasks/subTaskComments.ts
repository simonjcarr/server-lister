'use server'
import { db } from '@/db'
import { subTaskComments } from '@/db/schema/serverTasks'
import { eq } from 'drizzle-orm'

// Get all comments for a subtask
export async function getComments(subTaskId: number) {
  return db.query.subTaskComments.findMany({
    where: eq(subTaskComments.subTaskId, subTaskId),
    with: {
      user: true
    },
    orderBy: (comments, { asc }) => [asc(comments.createdAt)]
  })
}

// Create a new comment
export async function createComment({ subTaskId, comment, mentions, userId }: { subTaskId: number, comment: string, mentions: string[], userId: string }) {
  return db.insert(subTaskComments).values({
    subTaskId,
    userId,
    comment,
    mentions,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

// Update a comment (only if user is author)
export async function updateComment({ id, comment, mentions, userId }: { id: number, comment: string, mentions: string[], userId: string }) {
  // Only update if user is author
  const existing = await db.query.subTaskComments.findFirst({
    where: eq(subTaskComments.id, id)
  })
  if (!existing || existing.userId !== userId) throw new Error('Forbidden')
  return db.update(subTaskComments)
    .set({ comment, mentions, updatedAt: new Date() })
    .where(eq(subTaskComments.id, id))
}

// Delete a comment (only if user is author)
export async function deleteComment(id: number, userId: string) {
  const existing = await db.query.subTaskComments.findFirst({
    where: eq(subTaskComments.id, id)
  })
  if (!existing || existing.userId !== userId) throw new Error('Forbidden')
  return db.delete(subTaskComments).where(eq(subTaskComments.id, id))
}
