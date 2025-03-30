import { pgTable, text, timestamp, serial, uniqueIndex, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const os = pgTable(
  "os",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    version: text("version").notNull(),
    EOLDate: timestamp("eol_date", { withTimezone: true }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_os_name_idx").on(table.name)]
);

export const insertOSSchema = createInsertSchema(os);
export const selectOSSchema = createSelectSchema(os);
export const updateOSSchema = createUpdateSchema(os);
export type InsertOS = z.infer<typeof insertOSSchema>;
export type SelectOS = z.infer<typeof selectOSSchema>;
export type UpdateOS = z.infer<typeof updateOSSchema>;

export const osPatchVersions = pgTable(
  "os_patch_versions",
  {
    id: serial("id").primaryKey(),
    osId: integer("osId")
      .notNull()
      .references(() => os.id, { onDelete: "cascade" }),
    patchVersion: text("patch_version").notNull(),
    releaseDate: timestamp("release_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("os_patch_versions_osId_idx").on(table.osId)]
);

export const insertOSPatchVersionSchema = createInsertSchema(osPatchVersions);
export const selectOSPatchVersionSchema = createSelectSchema(osPatchVersions);
export const updateOSPatchVersionSchema = createUpdateSchema(osPatchVersions);
export type InsertOSPatchVersion = z.infer<typeof insertOSPatchVersionSchema>;
export type SelectOSPatchVersion = z.infer<typeof selectOSPatchVersionSchema>;
export type UpdateOSPatchVersion = z.infer<typeof updateOSPatchVersionSchema>;
