import { pgTable, serial, text, timestamp, integer, boolean, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { servers } from './servers';
import { users } from './users';

// Main build doc table
export const buildDocs = pgTable(
  "build_docs",
  {
    id: serial("id").primaryKey(),
    serverId: integer("server_id").notNull().references(() => servers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    createdBy: text("created_by").notNull().references(() => users.id),
    updatedBy: text("updated_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("build_docs_server_id_idx").on(table.serverId),
  ]
);

// Define the build doc sections table
// Need to use type assertion to handle self-reference
export const buildDocSections = pgTable(
  "build_doc_sections",
  {
    id: serial("id").primaryKey(),
    buildDocId: integer("build_doc_id").notNull().references(() => buildDocs.id, { onDelete: "cascade" }),
    parentSectionId: integer("parent_section_id").references((): AnyPgColumn => buildDocSections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"),
    order: integer("order").notNull().default(0),
    createdBy: text("created_by").notNull().references(() => users.id),
    updatedBy: text("updated_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("build_doc_sections_build_doc_id_idx").on(table.buildDocId),
    index("build_doc_sections_parent_section_id_idx").on(table.parentSectionId),
  ]
);

// Build doc section templates table
export const buildDocSectionTemplates = pgTable(
  "build_doc_section_templates",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content"),
    tags: text("tags").array(),
    isPublic: boolean("is_public").notNull().default(true),
    createdBy: text("created_by").notNull().references(() => users.id),
    updatedBy: text("updated_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// Schemas for build docs
export const insertBuildDocSchema = createInsertSchema(buildDocs);
export const selectBuildDocSchema = createSelectSchema(buildDocs);
export const updateBuildDocSchema = createUpdateSchema(buildDocs);
export type InsertBuildDoc = z.infer<typeof insertBuildDocSchema>;
export type SelectBuildDoc = z.infer<typeof selectBuildDocSchema>;
export type UpdateBuildDoc = z.infer<typeof updateBuildDocSchema>;

// Schemas for build doc sections
export const insertBuildDocSectionSchema = createInsertSchema(buildDocSections);
export const selectBuildDocSectionSchema = createSelectSchema(buildDocSections);
export const updateBuildDocSectionSchema = createUpdateSchema(buildDocSections);
export type InsertBuildDocSection = z.infer<typeof insertBuildDocSectionSchema>;
export type SelectBuildDocSection = z.infer<typeof selectBuildDocSectionSchema>;
export type UpdateBuildDocSection = z.infer<typeof updateBuildDocSectionSchema>;

// Schemas for build doc section templates
export const insertBuildDocSectionTemplateSchema = createInsertSchema(buildDocSectionTemplates);
export const selectBuildDocSectionTemplateSchema = createSelectSchema(buildDocSectionTemplates);
export const updateBuildDocSectionTemplateSchema = createUpdateSchema(buildDocSectionTemplates);
export type InsertBuildDocSectionTemplate = z.infer<typeof insertBuildDocSectionTemplateSchema>;
export type SelectBuildDocSectionTemplate = z.infer<typeof selectBuildDocSectionTemplateSchema>;
export type UpdateBuildDocSectionTemplate = z.infer<typeof updateBuildDocSectionTemplateSchema>;
