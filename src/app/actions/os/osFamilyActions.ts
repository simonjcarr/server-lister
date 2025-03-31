"use server";

import { db } from "@/db";
import { osFamily, os } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { InsertOSFamily, UpdateOSFamily } from "@/db/schema";

export async function getOSFamilies() {
  try {
    const families = await db.select().from(osFamily).orderBy(osFamily.name);
    return families;
  } catch (error) {
    console.error("Error getting OS Families:", error);
    throw new Error("Failed to get OS Families");
  }
}

export async function addOSFamily(data: InsertOSFamily) {
  try {
    await db.insert(osFamily).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding OS Family:", error);
    throw new Error("Failed to create OS Family");
  }
}

export async function updateOSFamily(id: number, data: UpdateOSFamily) {
  try {
    await db
      .update(osFamily)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(osFamily.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating OS Family:", error);
    throw new Error("Failed to update OS Family");
  }
}

export async function deleteOSFamily(id: number) {
  try {
    // First check if any OS is using this family
    const osRecords = await db
      .select()
      .from(os)
      .where(eq(os.osFamilyId, id));
    
    if (osRecords.length > 0) {
      return { 
        success: false,
        message: "Cannot delete OS Family that is in use by Operating Systems"
      };
    }
    
    await db.delete(osFamily).where(eq(osFamily.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting OS Family:", error);
    throw new Error("Failed to delete OS Family");
  }
}

export async function getOSFamilyById(id: number) {
  try {
    const family = await db.select().from(osFamily).where(eq(osFamily.id, id)).limit(1);
    if (family.length === 0) {
      throw new Error("OS Family not found");
    }
    return family[0];
  } catch (error) {
    console.error("Error getting OS Family by ID:", error);
    throw new Error("Failed to get OS Family by ID");
  }
}

export async function getOSFamilyWithOSCount() {
  try {
    console.log("Starting getOSFamilyWithOSCount");
    
    // First, get all the OS families
    const families = await db.select().from(osFamily).orderBy(osFamily.name);
    console.log("OS Families:", families);
    
    // If there are no families, return an empty array
    if (!families || families.length === 0) {
      console.log("No OS families found.");
      return [];
    }
    
    // Then get all the OS records
    const allOS = await db.select().from(os);
    console.log("All OS records:", allOS);
    
    // Manual count for each OS family
    const result = families.map(family => {
      // Count OS records that have this family ID
      const count = allOS.filter(o => o.osFamilyId === family.id).length;
      console.log(`Family ${family.id} (${family.name}) has ${count} OS records`);
      
      return {
        ...family,
        osCount: count
      };
    });
    
    console.log("Final result:", result);
    return result;
  } catch (error) {
    console.error("Error getting OS Families with counts:", error);
    throw new Error("Failed to get OS Families with counts");
  }
}
