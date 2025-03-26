"use server";

import { db } from "@/db";
import { os, osPatchVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
    // Debug query to directly check for patch versions
    const debugPatchVersions = await db
      .select({
        osId: osPatchVersions.osId,
        patchVersion: osPatchVersions.patchVersion,
      })
      .from(osPatchVersions);
    
    console.log("Debug - All patch versions:", JSON.stringify(debugPatchVersions, null, 2));
    
    // Get all OS records
    const osRecords = await db.select().from(os);
    console.log("OS records:", JSON.stringify(osRecords, null, 2));
    
    // For each OS, find the latest patch version
    const results = await Promise.all(
      osRecords.map(async (osRecord) => {
        // Find the latest patch version for this OS
        const patchVersions = await db
          .select({
            patchVersion: osPatchVersions.patchVersion,
          })
          .from(osPatchVersions)
          .where(eq(osPatchVersions.osId, osRecord.id))
          .orderBy(desc(osPatchVersions.patchVersion))
          .limit(1);
        
        return {
          ...osRecord,
          latestPatchVersion: patchVersions.length > 0 
            ? patchVersions[0].patchVersion 
            : "No patch version"
        };
      })
    );
    
    console.log("Final results:", JSON.stringify(results, null, 2));
    return results as OSWithPatchVersion[];
  } catch (error) {
    console.error("Error getting OSs:", error);
    throw new Error("Failed to get OSs");
  }
}
