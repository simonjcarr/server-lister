'use server'

import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { 
  notifications, 
  users_servers, 
  server_collection_subscriptions, 
  servers_collections, 
  servers,
  users,
  chatCategories 
} from "@/db/schema";
import { ChatMessage } from "./chatActions";

// Send notification to users who have favorited the server or subscribed to a collection containing it
export async function sendChatNotifications(message: ChatMessage): Promise<void> {
  try {
    // Extract server ID from chatRoomId (format is "server:42")
    const parts = message.chatRoomId.split(':');
    if (parts.length !== 2 || parts[0] !== 'server') {
      // Not a server chat room
      return;
    }
    const serverId = parseInt(parts[1], 10);
    if (isNaN(serverId)) {
      return;
    }

    // Get the server details for notification
    const serverDetails = await db
      .select({ hostname: servers.hostname })
      .from(servers)
      .where(eq(servers.id, serverId))
      .then(results => results[0]);

    if (!serverDetails) {
      console.error(`Server with ID ${serverId} not found`);
      return;
    }

    // Get users who favorited this server
    const favoriteUsers = await db
      .select({ userId: users_servers.userId })
      .from(users_servers)
      .where(eq(users_servers.serverId, serverId));

    // Get collections that contain this server
    const collections = await db
      .select({ collectionId: servers_collections.collectionId })
      .from(servers_collections)
      .where(eq(servers_collections.serverId, serverId));

    const collectionIds = collections.map(c => c.collectionId);

    // If no collections found, just notify users who favorited the server
    if (collectionIds.length === 0) {
      await notifyUsers(
        favoriteUsers.map(u => u.userId), 
        message, 
        serverDetails.hostname
      );
      return;
    }

    // Get users subscribed to any collection containing this server
    const subscriptionUsers = await db
      .select({ userId: server_collection_subscriptions.userId })
      .from(server_collection_subscriptions)
      .where(inArray(server_collection_subscriptions.collectionId, collectionIds));

    // Combine both sets of users (favorites and subscriptions)
    const userIdsToNotify = new Set([
      ...favoriteUsers.map(u => u.userId),
      ...subscriptionUsers.map(u => u.userId)
    ]);

    // Don't notify the user who sent the message
    userIdsToNotify.delete(message.userId);

    // Send notifications to all users
    if (userIdsToNotify.size > 0) {
      await notifyUsers(
        Array.from(userIdsToNotify), 
        message, 
        serverDetails.hostname
      );
    }
  } catch (error) {
    console.error("Error sending chat notifications:", error);
  }
}

// Helper function to create notifications for users
async function notifyUsers(
  userIds: string[], 
  message: ChatMessage, 
  serverHostname: string
): Promise<void> {
  try {
    if (userIds.length === 0) return;

    const now = new Date();
    const categoryName = await getCategoryName(message.categoryId);

    // Get the sender's name
    const sender = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, message.userId))
      .then(results => results[0]);
    
    const senderName = sender?.name || 'Unknown User';
    
    // Create a notification for each user
    const notifications = userIds.map(userId => ({
      userId,
      title: `New message on ${serverHostname}`,
      message: `${senderName} posted in ${categoryName}: "${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}"`,
      read: false,
      createdAt: now,
      updatedAt: now,
    }));

    // Insert all notifications
    await db.insert(notifications).values(notifications);
  } catch (error) {
    console.error("Error creating notifications:", error);
  }
}

// Helper function to get category name
async function getCategoryName(categoryId: number): Promise<string> {
  try {
    const category = await db
      .select({ name: chatCategories.name })
      .from(chatCategories)
      .where(eq(chatCategories.id, categoryId))
      .then(results => results[0]);
    
    return category?.name || 'Chat';
  } catch (error) {
    console.error("Error getting category name:", error);
    return 'Chat';
  }
}
