"use server";

import db from "@/db/getdb";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  InsertLocation,
  SelectLocation,
  UpdateLocation,
} from "@/db/schema";



export async function getLocations() {
  try {
    const locationResult = await db.select().from(locations) as SelectLocation[];
    return locationResult;
  } catch (error) {
    console.error("Error getting locations:", error);
    throw new Error("Failed to get locations");
  }
}

export async function getLocationById(id: number) {
  try {
    
    // Execute query with current database
    const locationResult = await db.select().from(locations).where(eq(locations.id, id)).limit(1) as SelectLocation[];
    return locationResult[0];
  } catch (error) {
    console.error("Error getting location by ID:", error);
    throw new Error("Failed to get location by ID");
  }
}

export async function addLocation(data: InsertLocation) {
  try {
    await db.insert(locations).values({
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
    await db
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
