import { pgTable, text, timestamp, serial, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const drawings = pgTable(
  "drawings",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    svg: text("svg"),
    xml: text("xml"),
    webp: text("webp"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("drawings_name_idx").on(table.name),
  ]
);

export const insertDrawingSchema = createInsertSchema(drawings);
export const selectDrawingSchema = createSelectSchema(drawings);
export const updateDrawingSchema = createUpdateSchema(drawings);
export type InsertDrawing = z.infer<typeof insertDrawingSchema>;
export type SelectDrawing = z.infer<typeof selectDrawingSchema>;
export type UpdateDrawing = z.infer<typeof updateDrawingSchema>;
