'use server'
import { db } from '@/db'
import { subTaskComments } from '@/db/schema/serverTasks'
import { eq } from 'drizzle-orm'

// Get all comments for a subtask
export async function getComments(subTaskId: number) {
  try {
    const comments = await db.query.subTaskComments.findMany({
      where: eq(subTaskComments.subTaskId, subTaskId),
      with: {
        user: true
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)]
    })
    
    return comments.map(comment => ({
      ...comment,
      mentions: Array.isArray(comment.mentions) ? comment.mentions : []
    }))
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

// Create a new comment
export async function createComment({ subTaskId, comment, mentions, userId }: { subTaskId: number, comment: string, mentions: string[], userId: string }) {
  await db.insert(subTaskComments).values({
    subTaskId,
    userId,
    comment,
    mentions,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  
  // Return a simple object that can be serialized
  return { success: true }
}

// Update a comment (only if user is author)
export async function updateComment({ id, comment, mentions, userId }: { id: number, comment: string, mentions: string[], userId: string }) {
  // Only update if user is author
  const existing = await db.query.subTaskComments.findFirst({
    where: eq(subTaskComments.id, id)
  })
  if (!existing || existing.userId !== userId) throw new Error('Forbidden')
  
  await db.update(subTaskComments)
    .set({ comment, mentions, updatedAt: new Date() })
    .where(eq(subTaskComments.id, id))
    
  return { success: true }
}

// Delete a comment (only if user is author)
export async function deleteComment(id: number, userId: string) {
  const existing = await db.query.subTaskComments.findFirst({
    where: eq(subTaskComments.id, id)
  })
  if (!existing || existing.userId !== userId) throw new Error('Forbidden')
  
  await db.delete(subTaskComments).where(eq(subTaskComments.id, id))
  
  return { success: true }
}
