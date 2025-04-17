"use server";
import { listTasks } from "./todoActions";

export default async function listTasksAction(todoId: number) {
  return await listTasks(todoId);
}
