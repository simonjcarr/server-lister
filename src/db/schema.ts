/* eslint-disable @typescript-eslint/no-unused-vars */
import { sql } from "drizzle-orm";
import { pgTable, text, integer, uniqueIndex, index, primaryKey, varchar, boolean, timestamp, serial, json, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import type { AdapterAccountType } from "next-auth/adapters";
import { z } from "zod";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  roles: json("roles").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

const insertUserSchema = createInsertSchema(users)
const selectUserSchema = createSelectSchema(users)
const updateUserSchema = createUpdateSchema(users)
export type InsertUser = z.infer<typeof insertUserSchema>
export type SelectUser = z.infer<typeof selectUserSchema> & { roles: string[] }
export type UpdateUser = z.infer<typeof updateUserSchema>

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey(verificationToken.identifier, verificationToken.token),
  })
);

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey(authenticator.userId, authenticator.credentialID),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

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

export const serverTypeEnum = pgEnum("serverTypeEnum", ["Physical", "Virtual"])
export type ServerType = (typeof serverTypeEnum.enumValues)[number];
export const servers = pgTable(
  "servers",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "set null" }),
    hostname: text("hostname").notNull(),
    ipv4: text("ipv4"),
    ipv6: text("ipv6"),
    description: text("description"),
    docLink: text("docLink"),
    business: integer("business"),
    itar: boolean("itar").notNull(),
    secureServer: boolean("secureServer").notNull(),
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

const insertServerSchema = createInsertSchema(servers)
const selectServerSchema = createSelectSchema(servers)
const updateServerSchema = createUpdateSchema(servers)
export type InsertServer = z.infer<typeof insertServerSchema>
export type SelectServer = z.infer<typeof selectServerSchema>
export type UpdateServer = z.infer<typeof updateServerSchema>

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("user_id_idx").on(table.userId),
])

const insertNoteSchema = createInsertSchema(notes)
const selectNoteSchema = createSelectSchema(notes)
const updateNoteSchema = createUpdateSchema(notes)
export type InsertNote = z.infer<typeof insertNoteSchema>
export type SelectNote = z.infer<typeof selectNoteSchema>
export type UpdateNote = z.infer<typeof updateNoteSchema>

export const serverNotes = pgTable("server_notes", {
  id: serial("id").primaryKey(),
  serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
  noteId: integer("noteId").notNull().references(() => notes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("server_notes_server_id_idx").on(table.serverId),
  index("server_notes_note_id_idx").on(table.noteId),
])

const insertServerNoteSchema = createInsertSchema(serverNotes)
const selectServerNoteSchema = createSelectSchema(serverNotes)
const updateServerNoteSchema = createUpdateSchema(serverNotes)
export type InsertServerNote = z.infer<typeof insertServerNoteSchema>
export type SelectServerNote = z.infer<typeof selectServerNoteSchema>
export type UpdateServerNote = z.infer<typeof updateServerNoteSchema>


export const certs = pgTable("certs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  requestedBy: text("requested_by").notNull().references(() => users.id, { onDelete: "set null" }),
  requestId: text("request_id"),
  requestedById: text("requested_by_id").references(() => users.id, { onDelete: "set null" }),
  csr: text("csr").notNull(),
  cert: text("cert").notNull(),
  key: text("key").notNull(),
  primaryDomain: text("primary_domain").notNull(),
  otherDomains: jsonb("other_domains"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("requested_by_idx").on(table.requestedById),
  index("request_id_idx").on(table.requestId),
  index("expires_at_idx").on(table.expiresAt),
])

const insertCertSchema = createInsertSchema(certs)
const selectCertSchema = createSelectSchema(certs)
const updateCertSchema = createUpdateSchema(certs)
export type InsertCert = z.infer<typeof insertCertSchema>
export type SelectCert = z.infer<typeof selectCertSchema>
export type UpdateCert = z.infer<typeof updateCertSchema>

export const serverCerts = pgTable("server_certs", {
  id: serial("id").primaryKey(),
  serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
  certId: integer("certId").notNull().references(() => certs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("server_id_idx").on(table.serverId),
  index("cert_id_idx").on(table.certId),
])

const insertServerCertSchema = createInsertSchema(serverCerts)
const selectServerCertSchema = createSelectSchema(serverCerts)
const updateServerCertSchema = createUpdateSchema(serverCerts)
export type InsertServerCert = z.infer<typeof insertServerCertSchema>
export type SelectServerCert = z.infer<typeof selectServerCertSchema>
export type UpdateServerCert = z.infer<typeof updateServerCertSchema>

export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_collection_name_idx").on(table.name)]
);

const insertCollectionSchema = createInsertSchema(collections)
const selectCollectionSchema = createSelectSchema(collections)
const updateCollectionSchema = createUpdateSchema(collections)
export type InsertCollection = z.infer<typeof insertCollectionSchema>
export type SelectCollection = z.infer<typeof selectCollectionSchema>
export type UpdateCollection = z.infer<typeof updateCollectionSchema>

export const servers_collections = pgTable(
  "servers_collections",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    collectionId: integer("collectionId")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("servers_collections_serverId_idx").on(table.serverId),
    uniqueIndex("unique_server_collection_idx").on(
      table.serverId,
      table.collectionId
    ),
  ]
);

const insertServerCollectionSchema = createInsertSchema(collections)
const selectServerCollectionSchema = createSelectSchema(collections)
const updateServerCollectionSchema = createUpdateSchema(collections)
export type InsertServerCollection = z.infer<typeof insertServerCollectionSchema>
export type SelectServerCollection = z.infer<typeof selectServerCollectionSchema>
export type UpdateServerCollection = z.infer<typeof updateServerCollectionSchema>

export const server_collection_subscriptions = pgTable(
  "server_collection_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    collectionId: integer("collectionId")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_user_collection_idx").on(
      table.userId,
      table.collectionId
    ),
    index("server_collection_subscriptions_collectionId_idx").on(
      table.collectionId
    ),
    index("server_collection_subscriptions_userId_idx").on(table.userId),
  ]
);

const insertServerCollectionSubscriptionSchema = createInsertSchema(server_collection_subscriptions)
const selectServerCollectionSubscriptionSchema = createSelectSchema(server_collection_subscriptions)
const updateServerCollectionSubscriptionSchema = createUpdateSchema(server_collection_subscriptions)
export type InsertServerCollectionSubscription = z.infer<typeof insertServerCollectionSubscriptionSchema>
export type SelectServerCollectionSubscription = z.infer<typeof selectServerCollectionSubscriptionSchema>
export type UpdateServerCollectionSubscription = z.infer<typeof updateServerCollectionSubscriptionSchema>

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
  (table) => [index("users_servers_serverId_idx").on(table.serverId)]
);

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("unique_tag_name_idx").on(table.name)]
);

export const servers_tags = pgTable(
  "servers_tags",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("servers_tags_serverId_idx").on(table.serverId)]
);

export const collections_tags = pgTable(
  "collections_tags",
  {
    id: serial("id").primaryKey(),
    collectionId: integer("collectionId")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("collections_tags_collectionId_idx").on(table.collectionId)]
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

const insertLocationSchema = createInsertSchema(locations)
const selectLocationSchema = createSelectSchema(locations)
const updateLocationSchema = createUpdateSchema(locations)
export type InsertLocation = z.infer<typeof insertLocationSchema>
export type SelectLocation = z.infer<typeof selectLocationSchema>
export type UpdateLocation = z.infer<typeof updateLocationSchema>

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

const insertOSSchema = createInsertSchema(os)
const selectOSSchema = createSelectSchema(os)
const updateOSSchema = createUpdateSchema(os)
export type InsertOS = z.infer<typeof insertOSSchema>
export type SelectOS = z.infer<typeof selectOSSchema>
export type UpdateOS = z.infer<typeof updateOSSchema>


export const serverGroups = pgTable(
  "server_groups",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: text("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("unique_server_group_name_idx").on(table.name),
    index("server_groups_ownerId_idx").on(table.ownerId),
  ]
);

const insertServerGroupSchema = createInsertSchema(serverGroups)
const selectServerGroupSchema = createSelectSchema(serverGroups)
const updateServerGroupSchema = createUpdateSchema(serverGroups)
export type InsertServerGroup = z.infer<typeof insertServerGroupSchema>
export type SelectServerGroup = z.infer<typeof selectServerGroupSchema>
export type UpdateServerGroup = z.infer<typeof updateServerGroupSchema>