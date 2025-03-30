import { pgTable, text, timestamp, json, index, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  roles: json("roles").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

const insertUserSchema = createInsertSchema(users);
const selectUserSchema = createSelectSchema(users);
const updateUserSchema = createUpdateSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema> & { roles: string[] };
export type UpdateUser = z.infer<typeof updateUserSchema>;

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("user_id_idx").on(table.userId),
]);

const insertNoteSchema = createInsertSchema(notes);
const selectNoteSchema = createSelectSchema(notes);
const updateNoteSchema = createUpdateSchema(notes);
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type SelectNote = z.infer<typeof selectNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;

// Server Group schema (user-owned groups)
export const serverGroups = pgTable(
  "server_groups",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: text("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_server_group_name_idx").on(table.name),
    index("server_groups_ownerId_idx").on(table.ownerId),
  ]
);

const insertServerGroupSchema = createInsertSchema(serverGroups);
const selectServerGroupSchema = createSelectSchema(serverGroups);
const updateServerGroupSchema = createUpdateSchema(serverGroups);
export type InsertServerGroup = z.infer<typeof insertServerGroupSchema>;
export type SelectServerGroup = z.infer<typeof selectServerGroupSchema>;
export type UpdateServerGroup = z.infer<typeof updateServerGroupSchema>;
