import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, uniqueIndex, index, integer, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

// Import these modules into servers.ts
import { projects } from './projects';
import { os } from './os';
import { locations } from './locations';
import { users } from './users';
import { drawings } from './drawings';

// Get the notes constant from the users module
const { notes } = require('./users');

export const serverTypeEnum = pgEnum("serverTypeEnum", ["Physical", "Virtual"]);
export type ServerType = (typeof serverTypeEnum.enumValues)[number];

export const servers = pgTable(
  "servers",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId").references(() => projects.id, { onDelete: "set null" }),
    hostname: text("hostname").notNull(),
    ipv4: text("ipv4"),
    ipv6: text("ipv6"),
    macAddress: text("macAddress"),
    description: text("description"),
    docLink: text("docLink"),
    business: integer("business"),
    itar: boolean("itar").notNull().default(false),
    secureServer: boolean("secureServer").notNull().default(false),
    osId: integer("osId").references(() => os.id, { onDelete: "set null" }),
    locationId: integer("locationId").references(() => locations.id, {
      onDelete: "set null",
    }),
    serverType: serverTypeEnum("serverType"),
    cores: integer("cores"),
    ram: integer("ram"),
    diskSpace: integer("diskSpace"),
    rack: text("rack"),
    position: text("position"),
    serial: text("serial"),
    assetTag: text("assetTag"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_server_hostname_idx").on(table.hostname),
    uniqueIndex("unique_server_ipv4_idx").on(table.ipv4)
      .where(sql`ipv4 IS NOT NULL`),
    uniqueIndex("unique_server_ipv6_idx")
      .on(table.ipv6)
      .where(sql`ipv6 IS NOT NULL`),
    index("server_project_id_idx").on(table.projectId),
    index("server_business_id_idx").on(table.business),
  ]
);

export const insertServerSchema = createInsertSchema(servers);
export const selectServerSchema = createSelectSchema(servers);
export const updateServerSchema = createUpdateSchema(servers);
export type InsertServer = z.infer<typeof insertServerSchema>;
export type SelectServer = z.infer<typeof selectServerSchema>;
export type UpdateServer = z.infer<typeof updateServerSchema>;

// Define the scan results schema
export const scanResultsSchema = z
  .object({
    host: z.object({
      hostname: z.string(),
      ipv4: z.string(),
      ipv6: z.string(),
      macAddress: z.string(),
      cores: z.number(),
      memoryGB: z.number(),
      storage: z.array(
        z.object({
          diskMountPath: z.string(),
          totalGB: z.number(),
          usedGB: z.number(),
        })
      ),
      users: z.array(
        z.object({
          username: z.string(),
          localAccount: z.boolean(),
        })
      ),
    }),
    services: z.array(
      z.object({
        name: z.string(),
        running: z.boolean(),
      })
    ),
    software: z.array(
      z.object({
        name: z.string(),
        version: z.string(),
        install_location: z.string(),
      })
    ),
    os: z.object({
      name: z.string(),
      version: z.string(),
      patch_version: z.string(),
    }),
  })
  .strict();

export type ScanResults = z.infer<typeof scanResultsSchema>;

export const serverScans = pgTable("server_scans", {
  id: serial("id").primaryKey(),
  serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
  scanDate: timestamp("scanDate", { withTimezone: true }).notNull(),
  scanResults: jsonb("scanResults").$type<ScanResults>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("server_id_idx").on(table.serverId),
]);

export const insertServerScanSchema = createInsertSchema(serverScans).extend({
  scanResults: scanResultsSchema,
});
export const selectServerScanSchema = createSelectSchema(serverScans).extend({
  scanResults: scanResultsSchema,
});
export const updateServerScanSchema = createUpdateSchema(serverScans).extend({
  scanResults: scanResultsSchema,
});

export type InsertServerScan = z.infer<typeof insertServerScanSchema>;
export type SelectServerScan = z.infer<typeof selectServerScanSchema>;
export type UpdateServerScan = z.infer<typeof updateServerScanSchema>;

export const serverNotes = pgTable("server_notes", {
  id: serial("id").primaryKey(),
  serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
  noteId: integer("noteId").notNull().references(() => notes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("server_notes_server_id_idx").on(table.serverId),
  index("server_notes_note_id_idx").on(table.noteId),
]);

export const insertServerNoteSchema = createInsertSchema(serverNotes);
export const selectServerNoteSchema = createSelectSchema(serverNotes);
export const updateServerNoteSchema = createUpdateSchema(serverNotes);
export type InsertServerNote = z.infer<typeof insertServerNoteSchema>;
export type SelectServerNote = z.infer<typeof selectServerNoteSchema>;
export type UpdateServerNote = z.infer<typeof updateServerNoteSchema>;

export const serverDrawings = pgTable(
  "server_drawings",
  {
    id: serial("id").primaryKey(),
    serverId: integer("server_id").notNull().references(() => servers.id, { onDelete: 'cascade' }),
    drawingId: integer("drawing_id").notNull().references(() => drawings.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_server_drawing_idx").on(table.serverId, table.drawingId)]
);

export const insertServerDrawingSchema = createInsertSchema(serverDrawings);
export const selectServerDrawingSchema = createSelectSchema(serverDrawings);
export const updateServerDrawingSchema = createUpdateSchema(serverDrawings);
export type InsertServerDrawing = z.infer<typeof insertServerDrawingSchema>;
export type SelectServerDrawing = z.infer<typeof selectServerDrawingSchema>;
export type UpdateServerDrawing = z.infer<typeof updateServerDrawingSchema>;

export const users_servers = pgTable(
  "users_servers",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("users_servers_serverId_idx").on(table.serverId),
    index("users_servers_userId_idx").on(table.userId),
    uniqueIndex("unique_user_server_idx").on(table.userId, table.serverId)
  ]
);

export const insertUserServerSchema = createInsertSchema(users_servers);
export const selectUserServerSchema = createSelectSchema(users_servers);
export const updateUserServerSchema = createUpdateSchema(users_servers);
export type InsertUserServer = z.infer<typeof insertUserServerSchema>;
export type SelectUserServer = z.infer<typeof selectUserServerSchema>;
export type UpdateUserServer = z.infer<typeof updateUserServerSchema>;

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_application_name_idx").on(table.name)]
);

export const applications_servers = pgTable(
  "applications_servers",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("applicationId")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("applications_servers_applicationId_idx").on(table.applicationId),
  ]
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_post_slug_idx").on(table.slug),
    index("post_serverId_idx").on(table.serverId),
  ]
);
