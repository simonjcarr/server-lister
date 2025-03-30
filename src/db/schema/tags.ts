import { pgTable, text, timestamp, serial, uniqueIndex, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { servers } from './servers';

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_tag_name_idx").on(table.name)]
);

export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);
export const updateTagSchema = createUpdateSchema(tags);
export type InsertTag = z.infer<typeof insertTagSchema>;
export type SelectTag = z.infer<typeof selectTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;

export const servers_tags = pgTable(
  "servers_tags",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("servers_tags_serverId_idx").on(table.serverId)]
);

export const insertServerTagSchema = createInsertSchema(servers_tags);
export const selectServerTagSchema = createSelectSchema(servers_tags);
export const updateServerTagSchema = createUpdateSchema(servers_tags);
export type InsertServerTag = z.infer<typeof insertServerTagSchema>;
export type SelectServerTag = z.infer<typeof selectServerTagSchema>;
export type UpdateServerTag = z.infer<typeof updateServerTagSchema>;
