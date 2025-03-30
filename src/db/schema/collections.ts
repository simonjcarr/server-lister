import { pgTable, text, timestamp, serial, uniqueIndex, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { type PgTableWithColumns } from "drizzle-orm/pg-core";

// Import the actual tables for references
import { servers } from './servers';
import { users } from './users';
import { tags } from './tags';

export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_collection_name_idx").on(table.name)]
);

export const insertCollectionSchema = createInsertSchema(collections);
export const selectCollectionSchema = createSelectSchema(collections);
export const updateCollectionSchema = createUpdateSchema(collections);
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type SelectCollection = z.infer<typeof selectCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;

export const servers_collections = pgTable(
  "servers_collections",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    collectionId: integer("collectionId")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("servers_collections_serverId_idx").on(table.serverId),
    uniqueIndex("unique_server_collection_idx").on(
      table.serverId,
      table.collectionId
    ),
  ]
);

export const insertServerCollectionSchema = createInsertSchema(servers_collections);
export const selectServerCollectionSchema = createSelectSchema(servers_collections);
export const updateServerCollectionSchema = createUpdateSchema(servers_collections);
export type InsertServerCollection = z.infer<typeof insertServerCollectionSchema>;
export type SelectServerCollection = z.infer<typeof selectServerCollectionSchema>;
export type UpdateServerCollection = z.infer<typeof updateServerCollectionSchema>;

export const server_collection_subscriptions = pgTable(
  "server_collection_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    collectionId: integer("collectionId")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_user_collection_idx").on(
      table.userId,
      table.collectionId
    ),
    index("server_collection_subscriptions_collectionId_idx").on(
      table.collectionId
    ),
    index("server_collection_subscriptions_userId_idx").on(table.userId),
  ]
);

export const insertServerCollectionSubscriptionSchema = createInsertSchema(server_collection_subscriptions);
export const selectServerCollectionSubscriptionSchema = createSelectSchema(server_collection_subscriptions);
export const updateServerCollectionSubscriptionSchema = createUpdateSchema(server_collection_subscriptions);
export type InsertServerCollectionSubscription = z.infer<typeof insertServerCollectionSubscriptionSchema>;
export type SelectServerCollectionSubscription = z.infer<typeof selectServerCollectionSubscriptionSchema>;
export type UpdateServerCollectionSubscription = z.infer<typeof updateServerCollectionSubscriptionSchema>;

export const collections_tags = pgTable(
  "collections_tags",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collectionId")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("collections_tags_collectionId_idx").on(table.collectionId)]
);
