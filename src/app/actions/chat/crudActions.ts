import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { and, eq, gt, desc } from "drizzle-orm";
import { auth } from "@/auth";

const session = await auth();

export const getRoomMessages = (chatRoomId: string, lastMessageId: number | null) => {
  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }
  
  if (!lastMessageId) {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatRoomId, chatRoomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100)
      .then((messages) => messages.reverse());
  }

  return db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.chatRoomId, chatRoomId), gt(chatMessages.id, lastMessageId)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(100)
    .then((messages) => messages.reverse());
};

export const insertChatMessage = (message: string, chatRoomId: string) => {
  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }
  return db
    .insert(chatMessages)
    .values({
      message,
      chatRoomId,
      userId: session?.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
};