"use server";

import { db } from "@/db";
import { os, osPatchVersions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { InsertOS, UpdateOS, SelectOS } from "@/db/schema";

// Define a type for the result of getOSs
export type OSWithPatchVersion = Omit<SelectOS, 'version' | 'description'> & {
  latestPatchVersion: string | null;
};

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

export async function getOSById(id: number, _timestamp?: number) {
  try {
    console.log(`Fetching OS with ID: ${id} at ${_timestamp || 'no timestamp'}`);
    const osData = await db.select().from(os).where(eq(os.id, id)).limit(1);
    if (osData.length === 0) {
      throw new Error("OS not found");
    }
    console.log(`Found OS data:`, JSON.stringify(osData[0], null, 2));
    return osData[0];
  } catch (error) {
    console.error("Error getting OS by ID:", error);
    throw new Error("Failed to get OS by ID");
  }
}

export async function getOSs(): Promise<OSWithPatchVersion[]> {
  try {
    const osResult = await db
      .select({
        id: os.id,
        name: os.name,
        EOLDate: os.EOLDate,
        version: os.version,
        description: os.description,
        createdAt: os.createdAt,
        updatedAt: os.updatedAt,
        latestPatchVersion: sql<string | null>`COALESCE(
        (
          SELECT ${osPatchVersions.patchVersion}
          FROM ${osPatchVersions}
          WHERE ${osPatchVersions.osId} = ${os.id}
          ORDER BY ${osPatchVersions.patchVersion} DESC
          LIMIT 1
        ),
        'No patch version'
      )`,
      })
      .from(os);
      console.log(JSON.stringify(osResult, null, 2));
    return osResult as OSWithPatchVersion[];
  } catch (error) {
    console.error("Error getting OSs:", error);
    throw new Error("Failed to get OSs");
  }
}
