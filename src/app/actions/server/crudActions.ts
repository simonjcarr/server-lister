'use server';

import { db } from "@/db";
import { InsertServer, servers } from "@/db/schema";

export async function addServer(data: InsertServer) {
  try {
    console.log(data)
    await db.insert(servers).values({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding server:", error);
    return { success: false };
  }
}