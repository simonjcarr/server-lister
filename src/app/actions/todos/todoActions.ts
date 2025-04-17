// Server actions for todos, tasks, comments
'use server'

import db from '@/db/getdb';
import { eq, and, desc, asc } from 'drizzle-orm';
import { todos, tasks, taskComments, users } from '@/db/schema';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function listTodos(serverId: number) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const userId = session.user.id;
  // Show public todos + private todos owned by user
  const rows = await db.select().from(todos)
    .where(
      and(
        eq(todos.serverId, serverId),
        // (isPublic = true OR userId = current user)
        eq(todos.isPublic, true) // Only public todos
      )
    )
    .orderBy(desc(todos.createdAt));
  // Add private todos owned by user
  const mine = await db.select().from(todos)
    .where(and(eq(todos.serverId, serverId), eq(todos.userId, userId), eq(todos.isPublic, false)))
    .orderBy(desc(todos.createdAt));
  return [...rows, ...mine];
}

export async function createTodo(serverId: number, title: string, isPublic: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const userId = session.user.id!;
  const now = new Date();
  const [todo] = await db.insert(todos).values({
    serverId, userId, title, isPublic, createdAt: now, updatedAt: now
  }).returning();
  revalidatePath(`/server/view/${serverId}`);
  return todo;
}

export async function listTasks(todoId: number) {
  const rows = await db.select({
    id: tasks.id,
    todoId: tasks.todoId,
    title: tasks.title,
    isComplete: tasks.isComplete,
    assignedTo: tasks.assignedTo,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
    assignedToName: users.name,
  })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedTo, users.id))
    .where(eq(tasks.todoId, todoId))
    .orderBy(asc(tasks.createdAt));
  return rows;
}

export async function createTask(todoId: number, title: string) {
  const now = new Date();
  const [task] = await db.insert(tasks).values({ todoId, title, isComplete: false, createdAt: now, updatedAt: now }).returning();
  return task;
}

export async function toggleTaskComplete(taskId: number, isComplete: boolean) {
  const [task] = await db.update(tasks).set({ isComplete, updatedAt: new Date() }).where(eq(tasks.id, taskId)).returning();
  return task;
}

export async function assignTask(taskId: number, userId: string) {
  // Update the assignedTo field
  const [updatedTask] = await db.update(tasks)
    .set({ assignedTo: userId, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  // Fetch the assigned user's name
  const user = await db.query.users.findFirst({ where: (u) => eq(u.id, userId) });

  // Create notification
  if (user) {
    const title = 'Task Assigned';
    const message = `You have been assigned a new task: "${updatedTask.title}"`;
    // Import createNotification dynamically to avoid circular deps
    const { createNotification } = await import("@/app/actions/notifications/crudActions");
    await createNotification(userId, title, message);
  }

  return {
    ...updatedTask,
    assignedToName: user?.name || user?.email || userId,
  };
}

export async function listTaskComments(taskId: number) {
  // Join with users for name
  const rows = await db.select({
    id: taskComments.id,
    userId: taskComments.userId,
    comment: taskComments.comment,
    createdAt: taskComments.createdAt,
    userName: users.name,
  }).from(taskComments)
    .leftJoin(users, eq(taskComments.userId, users.id))
    .where(eq(taskComments.taskId, taskId))
    .orderBy(asc(taskComments.createdAt));
  return rows;
}

export async function addTaskComment(taskId: number, comment: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const userId = session.user.id!;
  const now = new Date();
  // Insert the comment
  const [row] = await db.insert(taskComments).values({ taskId, userId, comment, createdAt: now, updatedAt: now }).returning();
  // Fetch the user name immediately after insert
  const user = await db.query.users.findFirst({ where: (u) => eq(u.id, userId) });
  return {
    ...row,
    userName: user?.name || '',
  };
}
