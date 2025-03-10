import { db } from "@/db";
import { users_servers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { SelectServer } from "@/db/schema";

export async function addServerToUser(serverId: number, userId: string) {
  try {
    await db.insert(users_servers).values({
      userId,
      serverId,
      createdAt: new Date().toISOString(),
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