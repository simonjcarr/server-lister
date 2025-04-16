"use server";

import db from "@/db/getdb";
import { os, osPatchVersions, osFamily } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { InsertOS, UpdateOS, SelectOS } from "@/db/schema";

// Define a type for the result of getOSs
export type OSWithPatchVersion = Omit<SelectOS, 'version' | 'description'> & {
  latestPatchVersion: string | null;
  familyName?: string | null;
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
    
    // Create the insert data, handling the case where osFamilyId might be null, undefined, or empty string
    const insertData = {
      ...data,
      // Handle null, undefined, or empty string for osFamilyId
      osFamilyId: data.osFamilyId || null,
      EOLDate: new Date(data.EOLDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(os).values(insertData);
    return { success: true };
  } catch (error) {
    console.error("Error adding OS:", error);
    throw new Error("Failed to create OS");
  }
}

export async function updateOS(id: number, data: UpdateOS) {
  try {
    
    // Handle the case where osFamilyId might be null or undefined
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    
    await db
      .update(os)
      .set(updateData)
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
      throw new Error("OS not found");
    }
    return osData[0];
  } catch (error) {
    console.error("Error getting OS by ID:", error);
    throw new Error("Failed to get OS by ID");
  }
}

export async function getOSs(): Promise<OSWithPatchVersion[]> {
  try {
    const osRecords = await db.select().from(os);
    
    const families = await db.select().from(osFamily);
    const familyMap = families.reduce((acc, family) => {
      acc[family.id] = family.name;
      return acc;
    }, {} as Record<number, string>);
    
    // For each OS, find the latest patch version and family name
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
            : "No patch version",
          familyName: osRecord.osFamilyId ? familyMap[osRecord.osFamilyId] : null
        };
      })
    );
    
    return results as OSWithPatchVersion[];
  } catch (error) {
    console.error("Error getting OSs:", error);
    throw new Error("Failed to get OSs");
  }
}
