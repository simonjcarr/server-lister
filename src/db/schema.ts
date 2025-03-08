import { sqliteTable, text, integer, uniqueIndex,  index, primaryKey } from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

export const accounts = sqliteTable(
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
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const authenticators = sqliteTable(
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
    credentialBackedUp: integer("credentialBackedUp", {
      mode: "boolean",
    }).notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    business: integer("business"),
    code: text("code"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("unique_project_name_idx").on(table.name)
  ]
);

export const business = sqliteTable(
  "business",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("unique_business_name_idx").on(table.name)
  ]
)

export const patchingPolicyResponsibility = sqliteTable(
  "patching_policy_responsibility",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("unique_responsibility_name_idx").on(table.name)
  ]
)

export const patchingPolicy = sqliteTable(
  "patching_policy",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    responsibility: integer("responsibility").notNull(),
    description: text("description"),
    dayOfWeek: text("dayOfWeek"),
    weekOfMonth: integer("weekOfMonth"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  }, (table) => [
    index("patching_policy_name_idx").on(table.name),
    index("patching_policy_responsibility_idx").on(table.responsibility)
  ]
)

export const servers = sqliteTable(
  "servers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("projectId").notNull(),
    hostname: text("hostname").notNull(),
    ipv4: text("ipv4"),
    ipv6: text("ipv6"),
    description: text("description"),
    docLink: text("docLink"),
    business: integer("business"),
    updatedAt: text("updated_at").notNull(),
    createdAt: text("created_at").notNull()
  }, (table) => [
    uniqueIndex("unique_server_hostname_idx").on(table.hostname),
    uniqueIndex("unique_server_ipv4_idx").on(table.ipv4),
    uniqueIndex("unique_server_ipv6_idx").on(table.ipv6),
    index("server_project_id_idx").on(table.projectId),
    index("server_business_id_idx").on(table.business)
  ]
)

export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    updatedAt: text("updated_at").notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => [
    uniqueIndex("unique_collection_name_idx").on(table.name)
  ]
)

export const servers_collections = sqliteTable(
  "servers_collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    serverId: integer("serverId").notNull(),
    collectionId: integer("collectionId").notNull(),
    createdAt: text("created_at").notNull(),
  }, (table) => [
    uniqueIndex("servers_collection_server_id_collection_id_idx").on(table.serverId, table.collectionId),
    index("servers_collection_server_id_idx").on(table.serverId),
    index("servers_collection_collection_id_idx").on(table.collectionId)
  ]
)

export const users_servers = sqliteTable(
  "users_servers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  }, (table) => [
    uniqueIndex("users_server_user_id_server_id_idx").on(table.userId, table.serverId),
    index("users_server_user_id_idx").on(table.userId),
    index("users_server_server_id_idx").on(table.serverId)
  ]
)

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    updatedAt: text("updated_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("unique_tag_name_idx").on(table.name)
  ]
)

export const servers_tags = sqliteTable(
  "servers_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
    tagId: integer("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  }, (table) => [
    uniqueIndex("servers_tag_server_id_tag_id_idx").on(table.serverId, table.tagId),
    index("servers_tag_server_id_idx").on(table.serverId),
    index("servers_tag_tag_id_idx").on(table.tagId)
  ]
)

export const collections_tags = sqliteTable(
  "collections_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    collectionId: integer("collectionId").notNull().references(() => collections.id, { onDelete: "cascade" }),
    tagId: integer("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  }, (table) => [
    uniqueIndex("collections_tag_collection_id_tag_id_idx").on(table.collectionId, table.tagId),
    index("collections_tag_collection_id_idx").on(table.collectionId),
    index("collections_tag_tag_id_idx").on(table.tagId)
  ]
)

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    authorId: text("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
    serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  }, (table) => [
    index("post_author_id_idx").on(table.authorId),
    index("post_server_id_idx").on(table.serverId)
  ]
)
