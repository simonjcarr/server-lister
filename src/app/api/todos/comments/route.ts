import { NextRequest, NextResponse } from 'next/server';
import { listTaskComments, addTaskComment } from '@/app/actions/todos/todoActions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = Number(searchParams.get('taskId'));
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  const rows = await listTaskComments(taskId);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { taskId, comment } = data;
  if (!taskId || !comment) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const row = await addTaskComment(taskId, comment);
  return NextResponse.json(row);
}
