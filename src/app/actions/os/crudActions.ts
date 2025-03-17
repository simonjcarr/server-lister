'use server';

import { db } from "@/db";
import { os } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SelectOS, InsertOS, UpdateOS } from "@/db/schema";

export async function getOS() {
  try {
    const osResult = await db.select().from(os);
    return osResult;
  } catch (error) {
    console.error("Error getting OS:", error);
    throw new Error("Failed to get OS");
  }
}

export async function addOS(data: InsertOS) {
  try {
    await db.insert(os).values({
      ...data,
      EOLDate: new Date(data.EOLDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding OS:", error);
    throw new Error("Failed to create OS");
  }
}

export async function updateOS(id: number, data: UpdateOS) {
  try {
    await db
      .update(os)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(os.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating OS:", error);
    throw new Error("Failed to update OS");
  }
}

export async function deleteOS(id: number) {
  try {
    await db.delete(os).where(eq(os.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting OS:", error);
    throw new Error("Failed to delete OS");
  }
}

export async function getOSById(id: number) {
  try {
    const osData = await db.select().from(os).where(eq(os.id, id)).limit(1);
    if (osData.length === 0) {
      throw new Error('OS not found');
    } 
    return osData[0];
  } catch (error) {
    console.error("Error getting OS by ID:", error);
    throw new Error("Failed to get OS by ID");
  }
}
