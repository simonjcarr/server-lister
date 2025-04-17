"use server";
import { assignTask } from "./todoActions";

export default async function assignTaskAction(taskId: number, userId: string) {
  return await assignTask(taskId, userId);
}
