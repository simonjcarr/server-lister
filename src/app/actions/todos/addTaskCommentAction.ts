"use server";
import { addTaskComment } from "./todoActions";

export default async function addTaskCommentAction(taskId: number, comment: string) {
  return await addTaskComment(taskId, comment);
}
