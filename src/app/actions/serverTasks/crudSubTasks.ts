'use server'
import { db } from "@/db"
import { subTasks, users, tasks } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export const getServerSubTasks = async (taskId: number) => {
  const taskResults = await db.select().from(subTasks).leftJoin(users, eq(subTasks.assignedTo, users.id)).where(eq(subTasks.taskId, taskId)).orderBy(asc(subTasks.order), asc(subTasks.createdAt))
  return taskResults
}

export const createSubTask = async (taskId: number, title: string, description: string) => {
  const date = new Date()
  
  // Create the subtask
  const subtask = await db.insert(subTasks).values({
    taskId,
    title,
    description,
    order: 999,
    isComplete: false,
    createdAt: date,
    updatedAt: date,
  }).returning();
  
  // Get the parent task with owner information
  const taskWithOwner = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      userId: tasks.userId,
      userName: users.name,
      userEmail: users.email
    })
    .from(tasks)
    .innerJoin(users, eq(tasks.userId, users.id))
    .where(eq(tasks.id, taskId));
  
  if (taskWithOwner.length > 0 && taskWithOwner[0].userEmail) {
    try {
      // Import the email queue function
      const { queueEmail } = await import('@/lib/email/emailQueue');
      
      // Queue the email notification
      await queueEmail({
        to: taskWithOwner[0].userEmail,
        subject: `New subtask created: ${title}`,
        html: `
          <h1>New Subtask Created</h1>
          <p>Hello ${taskWithOwner[0].userName},</p>
          <p>A new subtask has been created for your task: <strong>${taskWithOwner[0].title}</strong></p>
          <h2>Subtask Details:</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description || 'No description provided'}</p>
          <p>You can view and manage this task in your Server Lister dashboard.</p>
          <p>Thanks,<br/>OPS Hive Team</p>
        `,
        text: `New Subtask Created\n\nHello ${taskWithOwner[0].userName},\n\nA new subtask has been created for your task: ${taskWithOwner[0].title}\n\nSubtask Details:\nTitle: ${title}\nDescription: ${description || 'No description provided'}\n\nYou can view and manage this task in your Server Lister dashboard.\n\nThanks,\nOPS Hive Team`
      });
      
      console.log(`Email notification sent to task owner: ${taskWithOwner[0].userEmail}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw error here so that the subtask creation still succeeds
    }
  }
  
  return subtask[0];
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

// Delete a subtask by ID
export const deleteSubTask = async (subTaskId: number) => {
  await db.delete(subTasks).where(eq(subTasks.id, subTaskId))
  return { success: true }
}
