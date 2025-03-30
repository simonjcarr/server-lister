import { pgTable, text, timestamp, serial, uniqueIndex, index, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from './users';

export const chatCategories = pgTable(
  "chat_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_chat_category_name_idx").on(table.name),
    index("chat_categories_enabled_idx").on(table.enabled),
  ]
);

export const insertChatCategorySchema = createInsertSchema(chatCategories);
export const selectChatCategorySchema = createSelectSchema(chatCategories);
export const updateChatCategorySchema = createUpdateSchema(chatCategories);
export type InsertChatCategory = z.infer<typeof insertChatCategorySchema>;
export type SelectChatCategory = z.infer<typeof selectChatCategorySchema>;
export type UpdateChatCategory = z.infer<typeof updateChatCategorySchema>;

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    chatRoomId: text("chatRoomId").notNull(),
    categoryId: integer("categoryId")
      .notNull()
      .references(() => chatCategories.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("chat_messages_user_id_idx").on(table.userId),
    index("chat_messages_chatRoomId_idx").on(table.chatRoomId),
    index("chat_messages_categoryId_idx").on(table.categoryId),
  ]
);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);
export const updateChatMessageSchema = createUpdateSchema(chatMessages);
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SelectChatMessage = z.infer<typeof selectChatMessageSchema>;
export type UpdateChatMessage = z.infer<typeof updateChatMessageSchema>;
