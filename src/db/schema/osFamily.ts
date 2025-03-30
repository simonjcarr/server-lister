import { pgTable, text, timestamp, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { os } from "./os";

export const osFamily = pgTable(
  "os_family",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_os_family_name_idx").on(table.name)]
);

// Create relations
export const osFamilyRelations = relations(osFamily, ({ many }) => ({
  operatingSystems: many(os),
}));

// Create schemas
export const insertOSFamilySchema = createInsertSchema(osFamily);
export const selectOSFamilySchema = createSelectSchema(osFamily);
export const updateOSFamilySchema = createUpdateSchema(osFamily);

// Export types
export type InsertOSFamily = z.infer<typeof insertOSFamilySchema>;
export type SelectOSFamily = z.infer<typeof selectOSFamilySchema>;
export type UpdateOSFamily = z.infer<typeof updateOSFamilySchema>;
