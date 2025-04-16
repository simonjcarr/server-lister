"use server";
import db from "@/db/getdb";
import { collections, server_collection_subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from '@/auth';
import { SelectCollection } from "@/db/schema";

export interface CollectionWithSubscription extends SelectCollection {
  isSubscribed: boolean;
}

export async function getServerCollectionsWithSubscription(): Promise<CollectionWithSubscription[]> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      // If no user is logged in, return collections with isSubscribed as false
      const allCollections = await db
        .select()
        .from(collections)
        .orderBy(collections.name);
      
      return allCollections.map(collection => ({
        ...collection,
        isSubscribed: false
      }));
    }

    // Get all collections
    const allCollections = await db
      .select()
      .from(collections)
      .orderBy(collections.name);

    // Get user's subscribed collections
    const userSubscriptions = await db
      .select({ collectionId: server_collection_subscriptions.collectionId })
      .from(server_collection_subscriptions)
      .where(eq(server_collection_subscriptions.userId, userId));

    // Create a set of subscribed collection IDs for faster lookup
    const subscribedCollectionIds = new Set(userSubscriptions.map(sub => sub.collectionId));

    // Add subscription status to each collection
    return allCollections.map(collection => ({
      ...collection,
      isSubscribed: subscribedCollectionIds.has(collection.id)
    }));

  } catch (error) {
    console.error("Error getting server collections with subscription status:", error);
    return [];
  }
}
