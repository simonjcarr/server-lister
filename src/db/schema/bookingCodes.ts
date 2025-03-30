import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, uniqueIndex, index, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { projects } from "./projects";

// Main bookingCodeGroups table to store the parent "Name" entity
export const bookingCodeGroups = pgTable(
  "booking_code_groups",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("unique_booking_code_group_name_idx").on(table.name)
  ]
);

// Schema for the bookingCodes table with one-to-many relationship to bookingCodeGroups
export const bookingCodes = pgTable(
  "booking_codes",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => bookingCodeGroups.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    description: text("description"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Index for efficient lookups by group
    index("booking_code_group_id_idx").on(table.groupId),
    // Index for date range queries
    index("booking_code_validity_idx").on(table.validFrom, table.validTo),
    // Uniqueness constraint on code within the same time period
    uniqueIndex("unique_booking_code_in_timeframe_idx").on(
      table.groupId,
      table.code,
      table.validFrom
    )
  ]
);

// Join table to associate booking codes with projects
export const projectBookingCodes = pgTable(
  "project_booking_codes",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    bookingCodeGroupId: integer("booking_code_group_id")
      .notNull()
      .references(() => bookingCodeGroups.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Ensure a project can only be associated with a booking code group once
    uniqueIndex("unique_project_booking_code_group_idx").on(
      table.projectId,
      table.bookingCodeGroupId
    ),
    // Indexes for efficient lookups
    index("project_booking_codes_project_id_idx").on(table.projectId),
    index("project_booking_codes_group_id_idx").on(table.bookingCodeGroupId)
  ]
);

// Create Zod schemas for validation
export const insertBookingCodeGroupSchema = createInsertSchema(bookingCodeGroups);
export const selectBookingCodeGroupSchema = createSelectSchema(bookingCodeGroups);
export const updateBookingCodeGroupSchema = createUpdateSchema(bookingCodeGroups);

export const insertBookingCodeSchema = createInsertSchema(bookingCodes);
export const selectBookingCodeSchema = createSelectSchema(bookingCodes);
export const updateBookingCodeSchema = createUpdateSchema(bookingCodes);

export const insertProjectBookingCodeSchema = createInsertSchema(projectBookingCodes);
export const selectProjectBookingCodeSchema = createSelectSchema(projectBookingCodes);
export const updateProjectBookingCodeSchema = createUpdateSchema(projectBookingCodes);

// Export TypeScript types derived from the schemas
export type InsertBookingCodeGroup = z.infer<typeof insertBookingCodeGroupSchema>;
export type SelectBookingCodeGroup = z.infer<typeof selectBookingCodeGroupSchema>;
export type UpdateBookingCodeGroup = z.infer<typeof updateBookingCodeGroupSchema>;

export type InsertBookingCode = z.infer<typeof insertBookingCodeSchema>;
export type SelectBookingCode = z.infer<typeof selectBookingCodeSchema>;
export type UpdateBookingCode = z.infer<typeof updateBookingCodeSchema>;

export type InsertProjectBookingCode = z.infer<typeof insertProjectBookingCodeSchema>;
export type SelectProjectBookingCode = z.infer<typeof selectProjectBookingCodeSchema>;
export type UpdateProjectBookingCode = z.infer<typeof updateProjectBookingCodeSchema>;
