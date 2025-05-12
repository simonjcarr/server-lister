'use server'

import db from "@/db/getdb";
import { eq, inArray } from "drizzle-orm";
import { 
  users_servers, 
  server_collection_subscriptions, 
  servers_collections, 
  servers,
  chatCategories
} from "@/db/schema";
import { ChatMessage } from "./chatActions";
import { jobQueue } from "@/lib/queue";
import { type DeliveryType } from '@/lib/notification/notificationService';

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
    if (collectionIds.length === 0 && favoriteUsers.length === 0) {
      return; // No one to notify
    }

    // Get users subscribed to any collection containing this server
    const subscriptionUsers = collectionIds.length > 0 ?
      await db
        .select({ userId: server_collection_subscriptions.userId })
        .from(server_collection_subscriptions)
        .where(inArray(server_collection_subscriptions.collectionId, collectionIds))
      : [];

    // Combine both sets of users (favorites and subscriptions)
    const userIdsToNotify = new Set([
      ...favoriteUsers.map(u => u.userId),
      ...subscriptionUsers.map(u => u.userId)
    ]);

    // Don't notify the user who sent the message
    userIdsToNotify.delete(message.userId);

    if (userIdsToNotify.size === 0) {
      return; // No one to notify after filtering
    }

    // Get the category name
    const category = await db
      .select({ name: chatCategories.name })
      .from(chatCategories)
      .where(eq(chatCategories.id, message.categoryId))
      .then(results => results[0]);
    
    const categoryName = category?.name || 'Chat';

    // Create notification message
    const title = `New message on ${serverDetails.hostname}`;
    const notificationMessage = `${message.userName} posted in ${categoryName}: "${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}"`;

    // Prepare a more detailed HTML message for email
    const htmlMessage = `
      <h2>New message on ${serverDetails.hostname}</h2>
      <p><strong>${message.userName}</strong> posted in <strong>${categoryName}</strong>:</p>
      <blockquote>
        ${message.message}
      </blockquote>
      <p>Login to view and respond to this message.</p>
    `;
    
    // Process notifications with default delivery type 'both'
    // In a future enhancement, this could check user preferences
    const defaultDeliveryType: DeliveryType = 'both';
    
    // Add to job queue for processing with enhanced options
    await jobQueue.add('notification', { 
      title, 
      message: notificationMessage, 
      htmlMessage, // Add HTML version for email
      userIds: Array.from(userIdsToNotify),
      deliveryType: defaultDeliveryType
    });
  } catch (error) {
    console.error("Error sending chat notifications:", error);
  }
}


