import { pgTable, text, timestamp, serial, uniqueIndex, integer, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { osFamily } from "./osFamily";

// Software Whitelist Table
export const softwareWhitelist = pgTable(
  "software_whitelist",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    osFamilyId: integer("os_family_id").notNull().references(() => osFamily.id, { onDelete: "cascade" }),
    versionInfo: text("version_info"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Software names might differ between OS families, so we need name+os_family to be unique
    uniqueIndex("unique_software_name_osfamily_idx").on(table.name, table.osFamilyId),
    index("software_whitelist_osfamily_idx").on(table.osFamilyId)
  ]
);

// Software Whitelist Versions Table
export const softwareWhitelistVersions = pgTable(
  "software_whitelist_versions",
  {
    id: serial("id").primaryKey(),
    softwareWhitelistId: integer("software_whitelist_id").notNull().references(() => softwareWhitelist.id, { onDelete: "cascade" }),
    versionPattern: text("version_pattern").notNull(),
    description: text("description"),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    isApproved: boolean("is_approved").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // We want to allow multiple version patterns per software
    uniqueIndex("unique_software_version_idx").on(table.softwareWhitelistId, table.versionPattern),
    index("software_version_whitelist_idx").on(table.softwareWhitelistId)
  ]
);

// Relations
export const softwareWhitelistRelations = relations(softwareWhitelist, ({ one, many }) => ({
  osFamily: one(osFamily, {
    fields: [softwareWhitelist.osFamilyId],
    references: [osFamily.id],
  }),
  versions: many(softwareWhitelistVersions),
}));

export const softwareWhitelistVersionsRelations = relations(softwareWhitelistVersions, ({ one }) => ({
  software: one(softwareWhitelist, {
    fields: [softwareWhitelistVersions.softwareWhitelistId],
    references: [softwareWhitelist.id],
  }),
}));

// Create schemas for validation
export const insertSoftwareWhitelistSchema = createInsertSchema(softwareWhitelist);
export const selectSoftwareWhitelistSchema = createSelectSchema(softwareWhitelist);
export const updateSoftwareWhitelistSchema = createUpdateSchema(softwareWhitelist);

export const insertSoftwareWhitelistVersionSchema = createInsertSchema(softwareWhitelistVersions);
export const selectSoftwareWhitelistVersionSchema = createSelectSchema(softwareWhitelistVersions);
export const updateSoftwareWhitelistVersionSchema = createUpdateSchema(softwareWhitelistVersions);

// Export types
export type InsertSoftwareWhitelist = z.infer<typeof insertSoftwareWhitelistSchema>;
export type SelectSoftwareWhitelist = z.infer<typeof selectSoftwareWhitelistSchema>;
export type UpdateSoftwareWhitelist = z.infer<typeof updateSoftwareWhitelistSchema>;

export type InsertSoftwareWhitelistVersion = z.infer<typeof insertSoftwareWhitelistVersionSchema>;
export type SelectSoftwareWhitelistVersion = z.infer<typeof selectSoftwareWhitelistVersionSchema>;
export type UpdateSoftwareWhitelistVersion = z.infer<typeof updateSoftwareWhitelistVersionSchema>;
