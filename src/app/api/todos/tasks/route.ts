import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask, toggleTaskComplete } from '@/app/actions/todos/todoActions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const todoId = Number(searchParams.get('todoId'));
  if (!todoId) return NextResponse.json({ error: 'Missing todoId' }, { status: 400 });
  const rows = await listTasks(todoId);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { todoId, title } = data;
  if (!todoId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const task = await createTask(todoId, title);
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const { taskId, isComplete } = data;
  if (!taskId || typeof isComplete !== 'boolean') return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const task = await toggleTaskComplete(taskId, isComplete);
  return NextResponse.json(task);
}
