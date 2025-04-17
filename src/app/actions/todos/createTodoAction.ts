"use server";
import { createTodo } from "./todoActions";

export default async function createTodoAction(serverId: number, title: string, isPublic: boolean) {
  return await createTodo(serverId, title, isPublic);
}
