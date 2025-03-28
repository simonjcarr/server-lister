'use server';

import { db } from "@/db";
import { 
  servers, 
  serverDrawings, 
  drawings
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all servers (for dropdown selection)
export async function getAllServers() {
  try {
    const result = await db
      .select({
        id: servers.id,
        hostname: servers.hostname,
        ipv4: servers.ipv4,
        description: servers.description
      })
      .from(servers)
      .orderBy(servers.hostname);
    return result;
  } catch (error: unknown) {
    console.error("Error fetching servers:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch servers"
    );
  }
}

// Get servers linked to a drawing
export async function getDrawingServers(drawingId: number) {
  try {
    const result = await db
      .select({
        id: servers.id,
        hostname: servers.hostname,
        ipv4: servers.ipv4,
        description: servers.description
      })
      .from(serverDrawings)
      .innerJoin(servers, eq(serverDrawings.serverId, servers.id))
      .where(eq(serverDrawings.drawingId, drawingId))
      .orderBy(servers.hostname);
    return result;
  } catch (error: unknown) {
    console.error(`Error fetching servers for drawing ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch drawing servers"
    );
  }
}

// Get server IDs linked to a drawing (for initial form values)
export async function getDrawingServerIds(drawingId: number) {
  try {
    const result = await db
      .select({
        serverId: serverDrawings.serverId
      })
      .from(serverDrawings)
      .where(eq(serverDrawings.drawingId, drawingId));
    return result.map(item => item.serverId);
  } catch (error: unknown) {
    console.error(`Error fetching server IDs for drawing ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch drawing server IDs"
    );
  }
}

// Link servers to a drawing (replace all existing links)
export async function updateDrawingServers(drawingId: number, serverIds: number[]) {
  try {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Delete all existing links for this drawing
      await tx
        .delete(serverDrawings)
        .where(eq(serverDrawings.drawingId, drawingId));
      
      // If no servers to link, we're done
      if (!serverIds.length) return { success: true };
      
      // Add new links
      const timestamp = new Date();
      const values = serverIds.map(serverId => ({
        drawingId,
        serverId,
        createdAt: timestamp,
        updatedAt: timestamp
      }));
      
      await tx.insert(serverDrawings).values(values);
      
      return { success: true };
    });
  } catch (error: unknown) {
    console.error(`Error updating servers for drawing ${drawingId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update drawing servers"
    );
  }
}

// Get drawings linked to a server
export async function getServerDrawings(serverId: number) {
  try {
    const result = await db
      .select({
        id: drawings.id,
        name: drawings.name,
        description: drawings.description,
        svg: drawings.svg,
        webp: drawings.webp,
        xml: drawings.xml,
        createdAt: drawings.createdAt,
        updatedAt: drawings.updatedAt
      })
      .from(serverDrawings)
      .innerJoin(drawings, eq(serverDrawings.drawingId, drawings.id))
      .where(eq(serverDrawings.serverId, serverId))
      .orderBy(drawings.name);
    return result;
  } catch (error: unknown) {
    console.error(`Error fetching drawings for server ${serverId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch server drawings"
    );
  }
}
