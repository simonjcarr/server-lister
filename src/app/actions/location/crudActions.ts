"use server";

import { db, getTestDb, isTestEnvironment } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  InsertLocation,
  SelectLocation,
  UpdateLocation,
} from "@/db/schema";

// Get the appropriate database instance based on environment
function getDbForOperation() {
  // In test environments, always get a fresh connection
  if (isTestEnvironment()) {
    return getTestDb();
  }
  
  // In non-test environments, use the singleton connection
  return db;
}

export async function getLocations() {
  try {
    // Get fresh connection for test environments
    const currentDb = getDbForOperation();
    
    // Execute query with current database
    const locationResult = await currentDb.select().from(locations) as SelectLocation[];
    return locationResult;
  } catch (error) {
    console.error("Error getting locations:", error);
    throw new Error("Failed to get locations");
  }
}

export async function getLocationById(id: number) {
  try {
    // Get fresh connection for test environments
    const currentDb = getDbForOperation();
    
    // Execute query with current database
    const locationResult = await currentDb.select().from(locations).where(eq(locations.id, id)).limit(1) as SelectLocation[];
    return locationResult[0];
  } catch (error) {
    console.error("Error getting location by ID:", error);
    throw new Error("Failed to get location by ID");
  }
}

export async function addLocation(data: InsertLocation) {
  try {
    // Get fresh connection for test environments
    const currentDb = getDbForOperation();
    
    // Execute query with current database
    await currentDb.insert(locations).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding location:", error);
    throw new Error("Failed to create location");
  }
}

export async function updateLocation(id: number, data: UpdateLocation) {
  try {
    // Get fresh connection for test environments
    const currentDb = getDbForOperation();
    
    // Execute query with current database
    await currentDb
      .update(locations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating location:", error);
    throw new Error("Failed to update location");
  }
}
