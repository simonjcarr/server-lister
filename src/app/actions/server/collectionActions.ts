"use server";
import db from "@/db/getdb";
import {
  InsertCollection,
  SelectCollection,
  business,
  collections,
  locations,
  os,
  projects,
  servers,
  servers_collections,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Create a new collection
export async function createCollection(collection: InsertCollection): Promise<{ success: boolean; message?: string; collectionId?: number }> {
  try {
    const result = await db.insert(collections).values({
      ...collection,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: collections.id });
    
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true, collectionId: result[0].id };
  } catch (error) {
    console.error("Error creating collection:", error);
    return { success: false, message: "Failed to create collection" };
  }
}

// Update an existing collection
export async function updateCollection(id: number, collection: Partial<SelectCollection>): Promise<{ success: boolean; message?: string }> {
  try {
    await db.update(collections)
      .set({
        ...collection,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id));
    
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true };
  } catch (error) {
    console.error("Error updating collection:", error);
    return { success: false, message: "Failed to update collection" };
  }
}

// Delete a collection
export async function deleteCollection(id: number): Promise<{ success: boolean; message?: string; id?: number }> {
  try {
    await db.delete(collections)
      .where(eq(collections.id, id));
    
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true, id };
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { success: false, message: "Failed to delete collection" };
  }
}

// Get all available servers that are not in a specific collection
export async function getServersNotInCollection(collectionId: number) {
  try {
    // Get all servers with their related data first
    const allServers = await db
      .select({
        id: servers.id,
        hostname: servers.hostname,
        ipv4: servers.ipv4,
        ipv6: servers.ipv6,
        description: servers.description,
        docLink: servers.docLink,
        itar: servers.itar,
        secureServer: servers.secureServer,
        projectId: servers.projectId,
        projectName: projects.name,
        businessId: servers.business,
        businessName: business.name,
        osId: servers.osId,
        osName: os.name,
        locationId: servers.locationId,
        locationName: locations.name,
        createdAt: servers.createdAt,
        updatedAt: servers.updatedAt,
      })
      .from(servers)
      .leftJoin(projects, eq(servers.projectId, projects.id))
      .leftJoin(business, eq(servers.business, business.id))
      .leftJoin(os, eq(servers.osId, os.id))
      .leftJoin(locations, eq(servers.locationId, locations.id));
    
    // Get servers that are in the collection
    const serversInCollection = await db
      .select({
        serverId: servers_collections.serverId,
      })
      .from(servers_collections)
      .where(eq(servers_collections.collectionId, collectionId));
    
    // Create a set for O(1) lookups
    const serverIdsInCollection = new Set(
      serversInCollection.map((server) => server.serverId)
    );
    
    // Filter out the servers that are already in the collection
    const availableServers = allServers.filter(
      (server) => !serverIdsInCollection.has(server.id)
    );
    
    return availableServers;
  } catch (error) {
    console.error('Error getting servers not in collection:', error);
    return [];
  }
}

// Add multiple servers to a collection at once
export async function addServersToCollection(
  serverIds: number[],
  collectionId: number
): Promise<{ success: boolean; message?: string; addedServerIds?: number[] }> {
  try {
    // Create values array for bulk insert
    const values = serverIds.map((serverId) => ({
      serverId,
      collectionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    if (values.length > 0) {
      await db.insert(servers_collections).values(values);
    }
    
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true, addedServerIds: serverIds };
  } catch (error) {
    console.error("Error adding servers to collection:", error);
    return { success: false, message: "Failed to add servers to collection" };
  }
}
