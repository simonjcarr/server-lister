import { NextRequest, NextResponse } from "next/server";
import { assignTask } from "@/app/actions/todos/todoActions";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const { taskId, userId } = await req.json();
  if (!taskId || !userId) {
    return NextResponse.json({ error: "Missing taskId or userId" }, { status: 400 });
  }
  try {
    const updatedTask = await assignTask(taskId, userId);
    return NextResponse.json(updatedTask);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
