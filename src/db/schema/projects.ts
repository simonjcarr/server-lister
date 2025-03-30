import { pgTable, text, integer, timestamp, serial, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { drawings } from './drawings';

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    business: integer("business"),
    code: text("code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_project_name_idx").on(table.name)]
);

export const insertProjectSchema = createInsertSchema(projects).extend({
  description: z.string().nullable(),
  business: z.number().nullable(),
  code: z.string().nullable(),
});
export const selectProjectSchema = createSelectSchema(projects);
export const updateProjectSchema = createUpdateSchema(projects).extend({
  description: z.string().nullable(),
  business: z.number().nullable(),
  code: z.string().nullable(),
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type SelectProject = z.infer<typeof selectProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export const primaryProjectEngineers = pgTable(
  "primary_project_engineers",
  {
    userId: text("userId").notNull(),
    projectId: integer("project_id").notNull(),
  },
  (table) => [uniqueIndex("unique_user_project_idx").on(table.userId, table.projectId)]
);

export const insertPrimaryProjectEngineerSchema = createInsertSchema(primaryProjectEngineers);
export const selectPrimaryProjectEngineerSchema = createSelectSchema(primaryProjectEngineers);
export const updatePrimaryProjectEngineerSchema = createUpdateSchema(primaryProjectEngineers);
export type InsertPrimaryProjectEngineer = z.infer<typeof insertPrimaryProjectEngineerSchema>;
export type SelectPrimaryProjectEngineer = z.infer<typeof selectPrimaryProjectEngineerSchema>;
export type UpdatePrimaryProjectEngineer = z.infer<typeof updatePrimaryProjectEngineerSchema>;

export const projectLinks = pgTable(
  "project_links",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull(),
    link: text("link").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("project_links_name_idx").on(table.name),
    uniqueIndex("unique_project_link_idx").on(table.projectId, table.link),
    uniqueIndex("unique_project_link_name_idx").on(table.projectId, table.name),
  ]
);

export const insertProjectLinkSchema = createInsertSchema(projectLinks);
export const selectProjectLinkSchema = createSelectSchema(projectLinks);
export const updateProjectLinkSchema = createUpdateSchema(projectLinks);
export type InsertProjectLink = z.infer<typeof insertProjectLinkSchema>;
export type SelectProjectLink = z.infer<typeof selectProjectLinkSchema>;
export type UpdateProjectLink = z.infer<typeof updateProjectLinkSchema>;

export const projectLinkServers = pgTable(
  "project_link_servers",
  {
    id: serial("id").primaryKey(),
    projectLinkId: integer("project_link_id").notNull(),
    serverId: integer("server_id").notNull(),
  },
  (table) => [uniqueIndex("unique_project_link_server_idx").on(table.projectLinkId, table.serverId)]
);

export const insertProjectLinkServerSchema = createInsertSchema(projectLinkServers);
export const selectProjectLinkServerSchema = createSelectSchema(projectLinkServers);
export const updateProjectLinkServerSchema = createUpdateSchema(projectLinkServers);
export type InsertProjectLinkServer = z.infer<typeof insertProjectLinkServerSchema>;
export type SelectProjectLinkServer = z.infer<typeof selectProjectLinkServerSchema>;
export type UpdateProjectLinkServer = z.infer<typeof updateProjectLinkServerSchema>;

export const projectDrawings = pgTable(
  "project_drawings",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
    drawingId: integer("drawing_id").notNull().references(() => drawings.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex("unique_project_drawing_idx").on(table.projectId, table.drawingId)]
);

export const insertProjectDrawingSchema = createInsertSchema(projectDrawings);
export const selectProjectDrawingSchema = createSelectSchema(projectDrawings);
export const updateProjectDrawingSchema = createUpdateSchema(projectDrawings);
export type InsertProjectDrawing = z.infer<typeof insertProjectDrawingSchema>;
export type SelectProjectDrawing = z.infer<typeof selectProjectDrawingSchema>;
export type UpdateProjectDrawing = z.infer<typeof updateProjectDrawingSchema>;
