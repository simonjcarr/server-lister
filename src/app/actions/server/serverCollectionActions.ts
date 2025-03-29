"use server";
import { db } from "@/db";
import {
  collections,
  server_collection_subscriptions,
  servers,
  servers_collections,
  users,
  users_servers,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from '@/auth'

export async function getServerCollections() {
  try {
    const servers = await db
      .select()
      .from(collections)
      .orderBy(collections.name);
    return servers;
  } catch (error) {
    console.error("Error getting server collections:", error);
    return [];
  }
}

export async function getServerCollection(collectionId: number) {
  try {
    const collection = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId));
    return collection;
  } catch (error) {
    console.error("Error getting server collection:", error);
    return null;
  }
}

export async function addServerToCollection(
  serverId: number,
  collectionId: number
) {
  try {
    await db.insert(servers_collections).values({
      collectionId,
      serverId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    revalidatePath("/server/list");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding server to collection:", error);
    return { success: false };
  }
}

export async function removeServerFromCollection(
  serverId: number,
  collectionId: number
) {
  try {
    await db
      .delete(servers_collections)
      .where(
        and(
          eq(servers_collections.serverId, serverId),
          eq(servers_collections.collectionId, collectionId)
        )
      );
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true };
  } catch (error) {
    console.error("Error removing server from collection:", error);
    return { success: false };
  }
}

export async function getServersInCollection(collectionId: number) {
  try {
    const serversCollectionResult = await db
      .select({
        id: servers.id,
        hostname: servers.hostname,
        ipv4: servers.ipv4,
        description: servers.description,
      })
      .from(servers_collections)
      .innerJoin(servers, eq(servers_collections.serverId, servers.id))
      .where(eq(servers_collections.collectionId, collectionId));
    return serversCollectionResult;
  } catch (error) {
    console.error("Error getting servers in collection:", error);
    return [];
  }
}

export async function createUserCollectionSubscription(
  userId: string,
  collectionId: number
) {
  try {
    await db.insert(server_collection_subscriptions).values({
      userId,
      collectionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true };
  } catch (error) {
    console.error("Error creating user collection subscription:", error);
    return { success: false };
  }
}

export async function removeUserCollectionSubscription(
  userId: string,
  collectionId: number
) {
  try {
    await db
      .delete(server_collection_subscriptions)
      .where(
        and(
          eq(server_collection_subscriptions.userId, userId),
          eq(server_collection_subscriptions.collectionId, collectionId)
        )
      );
    // More aggressive revalidation to ensure all paths are updated
    revalidatePath("/server/collections");
    revalidatePath("/server/collections/", "page");
    return { success: true };
  } catch (error) {
    console.error("Error removing user collection subscription:", error);
    return { success: false };
  }
}

export async function getUsersInCollection(collectionId: number) {
  try {
    const usersCollectionResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(server_collection_subscriptions)
      .innerJoin(users, eq(server_collection_subscriptions.userId, users.id))
      .where(eq(server_collection_subscriptions.collectionId, collectionId));
    return usersCollectionResult;
  } catch (error) {
    console.error("Error getting users in collection:", error);
    return [];
  }
}

export async function subscribeUserToCollection(collectionId: number) {
  const session = await auth()
  const userId = session?.user?.id
  if(!userId) {
    return;
  }
  const result = await db.insert(server_collection_subscriptions).values({
    collectionId,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return true;
}

export async function unsubscribeUserFromCollection(collectionId: number) {
  const session = await auth();
  const userId = session?.user?.id
  if(!userId) {
    return false;
  }
  const result = await db
    .delete(server_collection_subscriptions)
    .where(
      and(
        eq(server_collection_subscriptions.userId, userId),
        eq(server_collection_subscriptions.collectionId, collectionId)
      )
    );
  return true;
}

export async function isSubscribedToCollection(collectionId: number) {
  const session = await auth();
  if (!session) {
    return false;
  }
  const userId = session.user?.id;
  if(!userId) {
    return false;
  }
  const result = await db
    .select()
    .from(server_collection_subscriptions)
    .where(
      and(
        eq(server_collection_subscriptions.userId, userId),
        eq(server_collection_subscriptions.collectionId, collectionId)
      )
    );
  return result.length > 0;
}
