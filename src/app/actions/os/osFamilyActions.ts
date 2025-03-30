"use server";

import { db } from "@/db";
import { osFamily, os } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { InsertOSFamily, UpdateOSFamily, SelectOSFamily } from "@/db/schema";

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
    const osCount = await db
      .select({ count: db.fn.count() })
      .from(os)
      .where(eq(os.osFamilyId, id));
    
    if (osCount[0].count > 0) {
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
    // Get all families
    const families = await db.select().from(osFamily).orderBy(osFamily.name);
    
    // Then get counts for each family in a single query using a subquery
    const familiesWithCount = await Promise.all(
      families.map(async (family) => {
        try {
          const countResult = await db.select({
            count: db.fn.count(os.id)
          })
          .from(os)
          .where(eq(os.osFamilyId, family.id));
          
          return {
            ...family,
            osCount: Number(countResult[0]?.count || 0)
          };
        } catch (error) {
          console.error(`Error counting OS for family ${family.id}:`, error);
          return {
            ...family,
            osCount: 0
          };
        }
      })
    );
    
    return familiesWithCount;
  } catch (error) {
    console.error("Error getting OS Families with counts:", error);
    throw new Error("Failed to get OS Families with counts");
  }
}
