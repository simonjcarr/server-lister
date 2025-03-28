'use server'
import { db } from "@/db";
import { drawings, InsertDrawing } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function createDrawing(formData: InsertDrawing) {
  try {
    const result = await db
      .insert(drawings)
      .values({ ...formData, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return result[0];
  } catch (error: unknown) {
    console.error(`Error creating drawing:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create drawing"
    );
  }
}

export async function updateDrawing(
  drawingId: number,
  formData: InsertDrawing
) {
  try {
    const result = await db
      .update(drawings)
      .set(formData)
      .where(eq(drawings.id, drawingId))
      .returning();
    return result[0];
  } catch (error: unknown) {
    console.error(`Error updating drawing with ID ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update drawing"
    );
  }
}

export async function deleteDrawing(drawingId: number) {
  try {
    const result = await db
      .delete(drawings)
      .where(eq(drawings.id, drawingId))
      .returning();
    return result[0];
  } catch (error: unknown) {
    console.error(`Error deleting drawing with ID ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete drawing"
    );
  }
}

export async function updateDrawingXML(drawingId: number, xml: string) {
  try {
    const result = await db
      .update(drawings)
      .set({ xml })
      .where(eq(drawings.id, drawingId))
      .returning();
    return result[0];
  } catch (error: unknown) {
    console.error(`Error updating drawing with ID ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update drawing"
    );
  }
}

export async function updateDrawingWebp(drawingId: number, webp: string) {
  try {
    const result = await db
      .update(drawings)
      .set({ webp })
      .where(eq(drawings.id, drawingId))
      .returning();
    return result[0];
  } catch (error: unknown) {
    console.error(`Error updating drawing webp with ID ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update drawing webp"
    );
  }
}

export const getDrawing = async (drawingId: number) => {
  try {
    const result = await db
      .select()
      .from(drawings)
      .where(eq(drawings.id, drawingId));
    return result[0];
  } catch (error: unknown) {
    console.error(`Error getting drawing with ID ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get drawing"
    );
  }
}

export const getDrawingsByIds = async (drawingIds: number[]) => {
  try {
    if (!drawingIds.length) return [];
    
    const result = await db
      .select()
      .from(drawings)
      .where(inArray(drawings.id, drawingIds));
    return result;
  } catch (error: unknown) {
    console.error(`Error getting drawings with IDs ${drawingIds}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get drawings by IDs"
    );
  }
}


