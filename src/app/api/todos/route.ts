import { NextRequest, NextResponse } from 'next/server';
import { listTodos, createTodo } from '@/app/actions/todos/todoActions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serverId = Number(searchParams.get('serverId'));
  if (!serverId) return NextResponse.json({ error: 'Missing serverId' }, { status: 400 });
  try {
    const todos = await listTodos(serverId);
    return NextResponse.json(todos);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { serverId, title, isPublic } = data;
  if (!serverId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  try {
    const todo = await createTodo(serverId, title, !!isPublic);
    return NextResponse.json(todo);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
