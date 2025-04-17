"use server";
import { listTaskComments } from "./todoActions";

export default async function listTaskCommentsAction(taskId: number) {
  return await listTaskComments(taskId);
}
