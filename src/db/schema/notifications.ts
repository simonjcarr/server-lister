import { pgTable, text, timestamp, serial, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from './users';

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_read_idx").on(table.read),
  ]
);

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export const updateNotificationSchema = createUpdateSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SelectNotification = z.infer<typeof selectNotificationSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;
