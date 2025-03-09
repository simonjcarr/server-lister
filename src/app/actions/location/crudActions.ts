"use server";

import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  InsertLocation,
  SelectLocation,
  UpdateLocation,
} from "@/db/schema";

export async function getLocations() {
  try {
    const locationResult: SelectLocation[] = await db.select().from(locations);
    return locations;
  } catch (error) {
    console.error("Error getting locations:", error);
    throw new Error("Failed to get locations");
  }
}

export async function addLocation(data: InsertLocation) {
  try {
    await db.insert(locations).values({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(locations.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating location:", error);
    throw new Error("Failed to update location");
  }
}
