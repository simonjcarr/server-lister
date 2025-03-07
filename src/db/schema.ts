import { sqliteTable, text, integer, uniqueIndex, foreignKey, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").unique().notNull(),
  },
  (table) => [
    uniqueIndex("unique_email_idx").on(table.email)
]);

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("unique_project_name_idx").on(table.name)
  ]
);

export const patchingPolicyResponsibility = sqliteTable(
  "patching_policy_responsibility",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
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
  }, (table) => [
    uniqueIndex("unique_server_hostname_idx").on(table.hostname),
    uniqueIndex("unique_server_ipv4_idx").on(table.ipv4),
    uniqueIndex("unique_server_ipv6_idx").on(table.ipv6),
    index("server_project_id_idx").on(table.projectId)
  ]
)

export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
  },
  (table) => [
    uniqueIndex("unique_collection_name_idx").on(table.name)
  ]
)

export const server_collections = sqliteTable(
  "server_collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    serverId: integer("serverId").notNull(),
    collectionId: integer("collectionId").notNull(),
  }, (table) => [
    uniqueIndex("server_collection_server_id_collection_id_idx").on(table.serverId, table.collectionId),
    index("server_collection_server_id_idx").on(table.serverId),
    index("server_collection_collection_id_idx").on(table.collectionId)
  ]
)

export const users_servers = sqliteTable(
  "users_servers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    serverId: integer("serverId").notNull(),
  }, (table) => [
    uniqueIndex("users_server_user_id_server_id_idx").on(table.userId, table.serverId),
    index("users_server_user_id_idx").on(table.userId),
    index("users_server_server_id_idx").on(table.serverId)
  ]
)



