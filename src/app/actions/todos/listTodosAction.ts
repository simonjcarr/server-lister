"use server";
import { listTodos } from "./todoActions";

export default async function listTodosAction(serverId: number) {
  return await listTodos(serverId);
}
