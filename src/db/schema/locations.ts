import { pgTable, text, timestamp, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_location_name_idx").on(table.name)]
);

export const insertLocationSchema = createInsertSchema(locations);
export const selectLocationSchema = createSelectSchema(locations);
export const updateLocationSchema = createUpdateSchema(locations);
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type SelectLocation = z.infer<typeof selectLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
