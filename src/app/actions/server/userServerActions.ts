'use server';

import db from "@/db/getdb";
import { users_servers, servers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Empty implementation of debugDumpUserServers to prevent build errors
export async function debugDumpUserServers() {
  // This is a placeholder function that used to contain debugging functionality
  // It's kept for backwards compatibility with any components that might still reference it
  return { message: 'Debug functionality has been removed' };
}

// Get just the server IDs for the user's favorites
export async function getFavoriteServerIds() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    // Query just the server IDs directly with a simpler query
    const result = await db.execute(sql`
      SELECT "serverId" 
      FROM users_servers
      WHERE "userId" = ${userId}
    `);
    
    // Handle possible case sensitivity
    const serverIds = result.rows.map((row: Record<string, unknown>) => {
      if ('serverId' in row) return row.serverId;
      if ('serverid' in row) return row.serverid;
      if ('SERVERID' in row) return row.SERVERID;
      // If we can't find a property, check all object keys
      const keys = Object.keys(row);
      for (const key of keys) {
        if (key.toLowerCase() === 'serverid') {
          return row[key];
        }
      }
      return null;
    }).filter(Boolean); // Remove any null values

    return serverIds;
  } catch (error) {
    console.error("Error fetching favorite server IDs:", error);
    return [];
  }
}

export async function addServerToUser(serverId: number, userId: string) {
  try {
    await db.insert(users_servers).values({
      userId,
      serverId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding server to user:", error);
    return { success: false };
  }
}

export async function removeServerFromUser(serverId: number, userId: string) {
  try {
    await db.delete(users_servers).where(and(eq(users_servers.serverId, serverId), eq(users_servers.userId, userId)))
    return { success: true };
  } catch (error) {
    console.error("Error removing server from user:", error);
    return { success: false };
  }
}

export async function getUserServers(userId: string) {
  try {
    const servers = await db
      .select()
      .from(users_servers)
      .where(eq(users_servers.userId, userId));
    return servers
  } catch (error) {
    console.error("Error getting user servers:", error);
    return [];
  }
}

export async function getServerUsers(serverId: number) {
  try {
    const users = await db
      .select()
      .from(users_servers)
      .where(eq(users_servers.serverId, serverId));
    return users;
  } catch (error) {
    console.error("Error getting server users:", error);
    return [];
  }
}

// Get all available servers for the favorites management page
export async function getAllServers() {
  try {
    const allServers = await db.select({
      id: servers.id,
      hostname: servers.hostname,
      ipv4: servers.ipv4,
      description: servers.description,
    })
    .from(servers)
    .orderBy(servers.hostname);

    return allServers;
  } catch (error) {
    console.error("Error fetching servers:", error);
    return [];
  }
}

// Get favorite servers with details
export async function getUserFavoriteServersWithDetails() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    // Get all favorite servers for the user with detailed server information
    const favoriteServers = await db
      .select({
        id: users_servers.id,
        userId: users_servers.userId,
        serverId: users_servers.serverId,
        createdAt: users_servers.createdAt,
        server: {
          id: servers.id,
          hostname: servers.hostname,
          ipv4: servers.ipv4,
          description: servers.description,
        }
      })
      .from(users_servers)
      .innerJoin(servers, eq(users_servers.serverId, servers.id))
      .where(eq(users_servers.userId, userId))
      .orderBy(servers.hostname);

    return favoriteServers;
  } catch (error) {
    console.error("Error fetching favorite server details:", error);
    return [];
  }
}

// Get favorite servers with details - direct SQL query approach
export async function getUserFavoriteServersWithDetailsDirect() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    // Use SQL query
    const result = await db.execute(sql`
      SELECT 
        us.id, 
        us."userId", 
        us."serverId", 
        us."createdAt",
        s.id as "server_id", 
        s.hostname as "server_hostname",
        s.ipv4 as "server_ipv4",
        s.description as "server_description"
      FROM users_servers us
      JOIN servers s ON us."serverId" = s.id
      WHERE us."userId" = ${userId}
      ORDER BY s.hostname
    `);

    // Format the result to match the expected structure
    const formattedResult = result.rows.map((row: Record<string, unknown>) => {
      // Extract the serverId, carefully handling case sensitivity
      let serverId;
      if ('serverId' in row) serverId = row.serverId;
      else if ('serverid' in row) serverId = row.serverid;
      else if ('SERVERID' in row) serverId = row.SERVERID;
      else if ('serverID' in row) serverId = row.serverID;
      
      return {
        id: row.id,
        userId: row.userId || row.userid,
        serverId: serverId, // Use the explicitly extracted serverId
        createdAt: row.createdAt || row.createdat,
        server: {
          id: row.server_id,
          hostname: row.server_hostname,
          ipv4: row.server_ipv4,
          description: row.server_description
        }
      };
    });

    return formattedResult;
  } catch (error) {
    console.error("Error fetching favorite server details (direct):", error);
    return [];
  }
}

// Update the user's favorite servers
export async function updateUserFavoriteServers(serverIds: number[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    
    // Filter out any invalid server IDs
    const validServerIds = serverIds.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);

    // Begin transaction
    await db.transaction(async (tx) => {
      // Delete all current favorites
      await tx
        .delete(users_servers)
        .where(eq(users_servers.userId, userId));

      // Skip if no servers to add
      if (validServerIds.length === 0) {
        return;
      }

      // Add new favorites
      const now = new Date();
      const insertValues = validServerIds.map(serverId => ({
        userId,
        serverId,
        createdAt: now,
        updatedAt: now
      }));

      await tx.insert(users_servers).values(insertValues);
    });

    revalidatePath("/"); // Revalidate the homepage to show updated favorites
    revalidatePath("/server/favourites"); // Revalidate the favourites page
    
    return { success: true };
  } catch (error) {
    console.error("Error updating favorite servers:", error);
    return { success: false, error: "Failed to update favorite servers" };
  }
}