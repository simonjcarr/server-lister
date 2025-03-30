import { pgTable, text, timestamp, serial, uniqueIndex, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const business = pgTable(
  "business",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_business_name_idx").on(table.name)]
);

export const insertBusinessSchema = createInsertSchema(business);
export const selectBusinessSchema = createSelectSchema(business);
export const updateBusinessSchema = createUpdateSchema(business);
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type SelectBusiness = z.infer<typeof selectBusinessSchema>;
export type UpdateBusiness = z.infer<typeof updateBusinessSchema>;

export const patchingPolicyResponsibility = pgTable(
  "patching_policy_responsibility",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_responsibility_name_idx").on(table.name)]
);

export const patchingPolicy = pgTable(
  "patching_policy",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    responsibility: integer("responsibility").notNull(),
    description: text("description"),
    dayOfWeek: text("dayOfWeek"),
    weekOfMonth: integer("weekOfMonth"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("patching_policy_name_idx").on(table.name),
    index("patching_policy_responsibility_idx").on(table.responsibility),
  ]
);
