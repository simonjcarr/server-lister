"use server";

// import { db, getTestDb, isTestEnvironment } from "@/db";
import getDb from "@/db/getdb";
import { osFamily, os } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { InsertOSFamily, UpdateOSFamily } from "@/db/schema";

// function getTestDbForOperation() {
//   if (isTestEnvironment()) return getTestDb();
//   return db;
// }

export async function getOSFamilies() {
  try {
    const families = await getDb.select().from(osFamily).orderBy(osFamily.name);
    return families;
  } catch (error) {
    console.error("Error getting OS Families:", error);
    throw new Error("Failed to get OS Families");
  }
}

export async function addOSFamily(data: InsertOSFamily) {
  try {
    await getDb.insert(osFamily).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding OS Family:", error);
    throw new Error(`Failed to create OS Family: ${error}`);
  }
}

export async function updateOSFamily(id: number, data: UpdateOSFamily) {
  try {
    await getDb
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
    const osRecords = await getDb
      .select()
      .from(os)
      .where(eq(os.osFamilyId, id));
    
    if (osRecords.length > 0) {
      return { 
        success: false,
        message: "Cannot delete OS Family that is in use by Operating Systems"
      };
    }
    
    await getDb.delete(osFamily).where(eq(osFamily.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting OS Family:", error);
    throw new Error("Failed to delete OS Family");
  }
}

export async function getOSFamilyById(id: number) {
  try {
    const family = await getDb.select().from(osFamily).where(eq(osFamily.id, id)).limit(1);
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
    
    // First, get all the OS families
    const families = await getDb.select().from(osFamily).orderBy(osFamily.name);
    
    // If there are no families, return an empty array
    if (!families || families.length === 0) {
      return [];
    }
    
    // Then get all the OS records
    const allOS = await getDb.select().from(os);
    
    // Manual count for each OS family
    const result = families.map(family => {
      // Count OS records that have this family ID
      const count = allOS.filter(o => o.osFamilyId === family.id).length;
      
      return {
        ...family,
        osCount: count
      };
    });
    
    return result;
  } catch (error) {
    console.error("Error getting OS Families with counts:", error);
    throw new Error("Failed to get OS Families with counts");
  }
}


