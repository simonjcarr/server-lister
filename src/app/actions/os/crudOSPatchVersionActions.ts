'use server'
import db from "@/db/getdb";
import { osPatchVersions, InsertOSPatchVersion } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Fetches all patch versions for a specific OS ID, ordered by release date descending.
 * @param osId - The ID of the OS.
 * @returns A promise that resolves to an array of OS patch versions.
 */
export async function getOSPatchVersionsByOSId(osId: number) {
  try {
    const versions = await db
      .select()
      .from(osPatchVersions)
      .where(eq(osPatchVersions.osId, osId))
      .orderBy(desc(osPatchVersions.releaseDate));
    return versions;
  } catch (error) {
    console.error("Error getting OS patch versions:", error);
    return [];
  }
}

/**
 * Adds a new OS patch version to the database.
 * @param data - The data for the new patch version. Must include osId, patchVersion, and releaseDate.
 * @returns A promise that resolves to the newly created patch version or null if insertion failed.
 */
export async function addOSPatchVersion(data: InsertOSPatchVersion) {
  try {
    // Ensure required fields are present
    if (!data.osId || !data.patchVersion || !data.releaseDate) {
      throw new Error("osId, patchVersion, and releaseDate are required.");
    }

    // Use TypeScript property names (camelCase) when passing to Drizzle ORM
    const valuesToInsert = {
      osId: data.osId,
      patchVersion: data.patchVersion, 
      releaseDate: new Date(data.releaseDate), 
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };

    const [newVersion] = await db
      .insert(osPatchVersions)
      .values(valuesToInsert)
      .returning();

    // Revalidate relevant paths if needed (adjust path as necessary)
    // revalidatePath(`/os/${data.osId}`);
    // revalidatePath('/os');

    return newVersion;
  } catch (error) {
    console.error("Error adding OS patch version:", error);
    throw new Error(`Failed to add OS patch version: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes an OS patch version by its ID.
 * @param id - The ID of the patch version to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteOSPatchVersion(id: number) {
  try {
    const result = await db
      .delete(osPatchVersions)
      .where(eq(osPatchVersions.id, id))
      .returning({ deletedId: osPatchVersions.id }); 

    if (result.length === 0) {
      console.warn(`OS patch version with ID ${id} not found for deletion.`);
    }

    // Revalidate relevant paths if needed
    // Consider revalidating the specific OS page or a general OS list page
    // revalidatePath(`/os/...`);
    // revalidatePath('/os');

  } catch (error) {
    console.error("Error deleting OS patch version:", error);
    throw new Error(`Failed to delete OS patch version: ${error instanceof Error ? error.message : String(error)}`);
  }
}
