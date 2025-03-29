'use server'

import { db } from "@/db";
import { asc, count, desc, eq, and, like } from "drizzle-orm";
import { chatCategories, chatMessages, users } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Type for message payload
export type ChatMessage = {
  id: number;
  userId: string;
  userName: string;
  userImage?: string;
  message: string;
  chatRoomId: string;
  categoryId: number;
  createdAt: Date;
};

export type ChatCategory = {
  id: number;
  name: string;
  icon?: string | null;
  messageCount?: number;
};

// Get categories with message counts for a chat room
export async function getChatCategoriesWithCounts(chatRoomId: string): Promise<ChatCategory[]> {
  const categoryResults = await db
    .select({
      id: chatCategories.id,
      name: chatCategories.name,
      icon: chatCategories.icon,
    })
    .from(chatCategories)
    .where(eq(chatCategories.enabled, true));
  
  // Get the count of messages for each category in this chatRoom
  const messageCounts = await Promise.all(
    categoryResults.map(async (category) => {
      const countResult = await db
        .select({ value: count() })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.categoryId, category.id),
            eq(chatMessages.chatRoomId, chatRoomId)
          )
        );
      
      return {
        ...category,
        messageCount: countResult[0]?.value || 0,
      };
    })
  );
  
  return messageCounts;
}

// Get chat messages for a specific category and chat room with pagination
export async function getChatMessages(
  chatRoomId: string,
  categoryId: number,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> {
  // Join with users to get user name and image
  const messages = await db
    .select({
      id: chatMessages.id,
      userId: chatMessages.userId,
      message: chatMessages.message,
      chatRoomId: chatMessages.chatRoomId,
      categoryId: chatMessages.categoryId,
      createdAt: chatMessages.createdAt,
      // User info will need to be fetched separately
    })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.chatRoomId, chatRoomId),
        eq(chatMessages.categoryId, categoryId)
      )
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch user details for each message
  const messagesWithUsers = await Promise.all(
    messages.map(async (msg) => {
      const user = await db
        .select({
          name: users.name,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, msg.userId))
        .then(results => results[0]);

      return {
        ...msg,
        userName: user?.name || 'Unknown User',
        userImage: user?.image || undefined,
      };
    })
  );

  return messagesWithUsers;
}

// Send a chat message
export async function sendChatMessage(
  message: string,
  chatRoomId: string,
  categoryId: number
): Promise<ChatMessage | null> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    if (!userId) {
      throw new Error("User ID not found");
    }

    const now = new Date();

    const inserted = await db
      .insert(chatMessages)
      .values({
        userId,
        message,
        chatRoomId,
        categoryId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!inserted.length) {
      return null;
    }

    const newMessage = inserted[0];

    // Get the user's name and image for the return value
    const userInfo = await db
      .select({
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, userId))
      .then(results => results[0]);

    revalidatePath(`/server/view/${chatRoomId.split(':')[1]}`);

    return {
      id: newMessage.id,
      userId: newMessage.userId,
      userName: userInfo?.name || "Unknown User",
      userImage: userInfo?.image || undefined,
      message: newMessage.message,
      chatRoomId: newMessage.chatRoomId,
      categoryId: newMessage.categoryId,
      createdAt: newMessage.createdAt,
    };
  } catch (error) {
    console.error("Error sending chat message:", error);
    return null;
  }
}

// Create a new chat category
export async function createChatCategory(name: string, icon?: string): Promise<number | null> {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const now = new Date();
    
    const inserted = await db
      .insert(chatCategories)
      .values({
        name,
        icon: icon || null,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: chatCategories.id });

    return inserted[0]?.id || null;
  } catch (error) {
    console.error("Error creating chat category:", error);
    return null;
  }
}

// Get all chat categories
export async function getAllChatCategories(): Promise<ChatCategory[]> {
  const categories = await db
    .select({
      id: chatCategories.id,
      name: chatCategories.name,
      icon: chatCategories.icon,
    })
    .from(chatCategories)
    .where(eq(chatCategories.enabled, true))
    .orderBy(asc(chatCategories.name));

  return categories;
}
