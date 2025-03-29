'use server';

import { db } from "@/db";
import { users_servers, servers, SelectServer, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Direct debugging function to dump the database contents
export async function debugDumpUserServers() {
  try {
    // Dump all user_servers entries
    const userServersEntries = await db
      .select()
      .from(users_servers);
      
    console.log('ALL USER SERVERS ENTRIES:', userServersEntries);
    
    // Get list of all users
    const allUsers = await db
      .select()
      .from(users);
      
    console.log('USERS COUNT:', allUsers.length);
    console.log('FIRST FEW USERS:', allUsers.slice(0, 3).map(u => ({ id: u.id, email: u.email })));
    
    // Get all servers
    const allServers = await db
      .select({ id: servers.id, hostname: servers.hostname })
      .from(servers);
      
    console.log('SERVERS COUNT:', allServers.length);
    console.log('SERVERS:', allServers);
    
    return { userServers: userServersEntries, users: allUsers.length, servers: allServers.length };
  } catch (error) {
    console.error("Error in debug dump:", error);
    return [];
  }
}

// SIMPLER VERSION: Get just the server IDs for the user's favorites
export async function getFavoriteServerIds() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No user ID found in session');
      return [];
    }

    const userId = session.user.id;
    console.log('Getting favorite server IDs for user:', userId);

    // Query just the server IDs directly with a simpler query
    const result = await db.execute(sql`
      SELECT "serverId" 
      FROM users_servers
      WHERE "userId" = ${userId}
    `);

    console.log('Raw favorite server IDs result:', JSON.stringify(result.rows, null, 2));
    
    // Handle possible case sensitivity
    const serverIds = result.rows.map((row: any) => {
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

    console.log('Extracted server IDs:', serverIds);
    return serverIds;
  } catch (error) {
    console.error("Error fetching favorite server IDs:", error);
    return [];
  }
}

// Get favorite servers with details - direct SQL query approach
export async function getUserFavoriteServersWithDetailsDirect() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No user ID found in session');
      return [];
    }

    const userId = session.user.id;
    console.log('Getting favorites direct SQL for user ID:', userId);

    // Use raw SQL query to troubleshoot
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

    // Log the raw result to see exactly what we're getting from the database
    console.log('Raw SQL result:', JSON.stringify(result.rows, null, 2));
    
    // Log row keys to check for case sensitivity
    if (result.rows.length > 0) {
      console.log('First row keys:', Object.keys(result.rows[0]));
    }

    // Format the result to match the expected structure
    const formattedResult = result.rows.map((row: any) => {
      // Extract the serverId, carefully handling case sensitivity
      let serverId;
      if ('serverId' in row) serverId = row.serverId;
      else if ('serverid' in row) serverId = row.serverid;
      else if ('SERVERID' in row) serverId = row.SERVERID;
      else if ('serverID' in row) serverId = row.serverID;
      
      console.log(`Row ID: ${row.id}, extracted serverId: ${serverId}`);
      
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

    // Log the IDs specifically for debugging
    console.log('Server IDs found:', formattedResult.map(item => item.serverId));
    console.log(`Found ${formattedResult.length} favorite servers (direct SQL) for user ${userId}`);
    return formattedResult;
  } catch (error) {
    console.error("Error fetching favorite server details (direct):", error);
    return [];
  }
}

export async function addServerToUser(serverId: number, userId: string) {
  try {
    await db.insert(users_servers).values({
      userId,
      serverId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      console.log('No user ID found in session');
      return [];
    }

    const userId = session.user.id;
    console.log('Getting favorites for user ID:', userId);

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

    console.log(`Found ${favoriteServers.length} favorite servers for user ${userId}`);
    return favoriteServers;
  } catch (error) {
    console.error("Error fetching favorite server details:", error);
    return [];
  }
}

export async function updateUserFavoriteServers(serverIds: number[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No user ID found in session during update');
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    console.log(`Updating favorites for user ${userId} with ${serverIds.length} servers`);
    console.log('Server IDs to save:', serverIds);

    // Filter out any invalid server IDs
    const validServerIds = serverIds.filter(id => typeof id === 'number' && !isNaN(id) && id > 0);
    console.log(`Filtered to ${validServerIds.length} valid server IDs:`, validServerIds);

    // Begin transaction
    await db.transaction(async (tx) => {
      // Delete all current favorites
      const deleteResult = await tx
        .delete(users_servers)
        .where(eq(users_servers.userId, userId));
      
      console.log('Deleted existing favorites');

      // Skip if no servers to add
      if (validServerIds.length === 0) {
        console.log('No servers to add, skipping insert');
        return;
      }

      // Add new favorites
      const now = new Date();
      const insertValues = validServerIds.map(serverId => {
        console.log('Adding favorite:', { userId, serverId });
        return {
          userId,
          serverId,
          createdAt: now,
          updatedAt: now
        };
      });

      // Log exact SQL values being inserted
      console.log('Insert values:', JSON.stringify(insertValues, null, 2));
      await tx.insert(users_servers).values(insertValues);
      console.log(`Inserted ${insertValues.length} new favorites`);
    });

    console.log('Revalidating paths');
    revalidatePath("/"); // Revalidate the homepage to show updated favorites
    revalidatePath("/server/favourites"); // Revalidate the favourites page
    
    // Verify the update by immediately fetching favorites
    const updatedFavorites = await db
      .select()
      .from(users_servers)
      .where(eq(users_servers.userId, userId));
    
    console.log(`Verification: Found ${updatedFavorites.length} favorites after update`);
    const updatedIds = updatedFavorites.map(fav => fav.serverId);
    console.log('Updated server IDs in database:', updatedIds);
    
    return { success: true, updatedFavorites: updatedFavorites.length };
  } catch (error) {
    console.error("Error updating favorite servers:", error);
    return { success: false, error: "Failed to update favorite servers" };
  }
}