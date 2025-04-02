import { pgTable, index, uniqueIndex, foreignKey, serial, text, timestamp, integer, boolean, jsonb, unique, json, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const serverTypeEnum = pgEnum("serverTypeEnum", ['Physical', 'Virtual'])
export const status = pgEnum("status", ['Pending', 'Ordered', 'Ready'])


export const serverGroups = pgTable("server_groups", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	ownerId: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("server_groups_ownerId_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_server_group_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "server_groups_ownerId_user_id_fk"
		}).onDelete("cascade"),
]);

export const osPatchVersions = pgTable("os_patch_versions", {
	id: serial().primaryKey().notNull(),
	osId: integer().notNull(),
	patchVersion: text("patch_version").notNull(),
	releaseDate: timestamp("release_date", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("os_patch_versions_osId_idx").using("btree", table.osId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.osId],
			foreignColumns: [os.id],
			name: "os_patch_versions_osId_os_id_fk"
		}).onDelete("cascade"),
]);

export const locations = pgTable("locations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	address: text(),
	latitude: text(),
	longitude: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_location_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const os = pgTable("os", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	version: text().notNull(),
	eolDate: timestamp("eol_date", { withTimezone: true, mode: 'string' }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	osFamilyId: integer("os_family_id"),
}, (table) => [
	uniqueIndex("unique_os_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.osFamilyId],
			foreignColumns: [osFamily.id],
			name: "os_os_family_id_os_family_id_fk"
		}),
]);

export const projectDrawings = pgTable("project_drawings", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	drawingId: integer("drawing_id").notNull(),
}, (table) => [
	uniqueIndex("unique_project_drawing_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.drawingId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_drawings_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.drawingId],
			foreignColumns: [drawings.id],
			name: "project_drawings_drawing_id_drawings_id_fk"
		}).onDelete("cascade"),
]);

export const drawings = pgTable("drawings", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	svg: text(),
	xml: text(),
	webp: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("drawings_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const primaryProjectEngineers = pgTable("primary_project_engineers", {
	userId: text().notNull(),
	projectId: integer("project_id").notNull(),
}, (table) => [
	uniqueIndex("unique_user_project_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.projectId.asc().nullsLast().op("int4_ops")),
]);

export const projectLinkServers = pgTable("project_link_servers", {
	id: serial().primaryKey().notNull(),
	projectLinkId: integer("project_link_id").notNull(),
	serverId: integer("server_id").notNull(),
}, (table) => [
	uniqueIndex("unique_project_link_server_idx").using("btree", table.projectLinkId.asc().nullsLast().op("int4_ops"), table.serverId.asc().nullsLast().op("int4_ops")),
]);

export const projectLinks = pgTable("project_links", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	link: text().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("project_links_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_project_link_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.link.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_project_link_name_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.name.asc().nullsLast().op("int4_ops")),
]);

export const applications = pgTable("applications", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_application_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const applicationsServers = pgTable("applications_servers", {
	id: serial().primaryKey().notNull(),
	applicationId: integer().notNull(),
	serverId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("applications_servers_applicationId_idx").using("btree", table.applicationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "applications_servers_applicationId_applications_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "applications_servers_serverId_servers_id_fk"
		}).onDelete("cascade"),
]);

export const usersServers = pgTable("users_servers", {
	id: serial().primaryKey().notNull(),
	userId: text().notNull(),
	serverId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_user_server_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.serverId.asc().nullsLast().op("text_ops")),
	index("users_servers_serverId_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops")),
	index("users_servers_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "users_servers_userId_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "users_servers_serverId_servers_id_fk"
		}).onDelete("cascade"),
]);

export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	serverId: integer().notNull(),
	content: text().notNull(),
	slug: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("post_serverId_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_post_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "posts_serverId_servers_id_fk"
		}).onDelete("cascade"),
]);

export const serversTags = pgTable("servers_tags", {
	id: serial().primaryKey().notNull(),
	serverId: integer().notNull(),
	tagId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("servers_tags_serverId_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "servers_tags_serverId_servers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "servers_tags_tagId_tags_id_fk"
		}).onDelete("cascade"),
]);

export const servers = pgTable("servers", {
	id: serial().primaryKey().notNull(),
	projectId: integer(),
	hostname: text().notNull(),
	ipv4: text(),
	ipv6: text(),
	macAddress: text(),
	description: text(),
	docLink: text(),
	business: integer(),
	itar: boolean().default(false).notNull(),
	secureServer: boolean().default(false).notNull(),
	osId: integer(),
	locationId: integer(),
	serverType: serverTypeEnum(),
	cores: integer(),
	ram: integer(),
	diskSpace: integer(),
	rack: text(),
	position: text(),
	serial: text(),
	assetTag: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	onboarded: boolean().default(false).notNull(),
}, (table) => [
	index("server_business_id_idx").using("btree", table.business.asc().nullsLast().op("int4_ops")),
	index("server_project_id_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_server_hostname_idx").using("btree", table.hostname.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_server_ipv4_idx").using("btree", table.ipv4.asc().nullsLast().op("text_ops")).where(sql`(ipv4 IS NOT NULL)`),
	uniqueIndex("unique_server_ipv6_idx").using("btree", table.ipv6.asc().nullsLast().op("text_ops")).where(sql`(ipv6 IS NOT NULL)`),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "servers_projectId_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.osId],
			foreignColumns: [os.id],
			name: "servers_osId_os_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "servers_locationId_locations_id_fk"
		}).onDelete("set null"),
]);

export const serverDrawings = pgTable("server_drawings", {
	id: serial().primaryKey().notNull(),
	serverId: integer("server_id").notNull(),
	drawingId: integer("drawing_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_server_drawing_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops"), table.drawingId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "server_drawings_server_id_servers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.drawingId],
			foreignColumns: [drawings.id],
			name: "server_drawings_drawing_id_drawings_id_fk"
		}).onDelete("cascade"),
]);

export const serverNotes = pgTable("server_notes", {
	id: serial().primaryKey().notNull(),
	serverId: integer().notNull(),
	noteId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("server_notes_note_id_idx").using("btree", table.noteId.asc().nullsLast().op("int4_ops")),
	index("server_notes_server_id_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "server_notes_serverId_servers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.noteId],
			foreignColumns: [notes.id],
			name: "server_notes_noteId_notes_id_fk"
		}).onDelete("cascade"),
]);

export const serverScans = pgTable("server_scans", {
	id: serial().primaryKey().notNull(),
	serverId: integer().notNull(),
	scanDate: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	scanResults: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("server_id_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "server_scans_serverId_servers_id_fk"
		}).onDelete("cascade"),
]);

export const tags = pgTable("tags", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_tag_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const serverCollectionSubscriptions = pgTable("server_collection_subscriptions", {
	id: serial().primaryKey().notNull(),
	userId: text().notNull(),
	collectionId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("server_collection_subscriptions_collectionId_idx").using("btree", table.collectionId.asc().nullsLast().op("int4_ops")),
	index("server_collection_subscriptions_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("unique_user_collection_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.collectionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "server_collection_subscriptions_userId_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "server_collection_subscriptions_collectionId_collections_id_fk"
		}).onDelete("cascade"),
]);

export const serversCollections = pgTable("servers_collections", {
	id: serial().primaryKey().notNull(),
	serverId: integer().notNull(),
	collectionId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("servers_collections_serverId_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_server_collection_idx").using("btree", table.serverId.asc().nullsLast().op("int4_ops"), table.collectionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "servers_collections_serverId_servers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "servers_collections_collectionId_collections_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const collections = pgTable("collections", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_collection_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const business = pgTable("business", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_business_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const patchingPolicy = pgTable("patching_policy", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	responsibility: integer().notNull(),
	description: text(),
	dayOfWeek: text(),
	weekOfMonth: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("patching_policy_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("patching_policy_responsibility_idx").using("btree", table.responsibility.asc().nullsLast().op("int4_ops")),
]);

export const certs = pgTable("certs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	requestId: text("request_id"),
	requestedById: text("requested_by_id"),
	csr: text(),
	cert: text(),
	key: text(),
	storagePath: text("storage_path"),
	serverId: integer().notNull(),
	primaryDomain: text("primary_domain").notNull(),
	otherDomains: jsonb("other_domains"),
	status: status().default('Pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("request_id_idx").using("btree", table.requestId.asc().nullsLast().op("text_ops")),
	index("requested_by_idx").using("btree", table.requestedById.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.requestedById],
			foreignColumns: [user.id],
			name: "certs_requested_by_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.serverId],
			foreignColumns: [servers.id],
			name: "certs_serverId_servers_id_fk"
		}).onDelete("set null"),
]);

export const patchingPolicyResponsibility = pgTable("patching_policy_responsibility", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_responsibility_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	roles: json().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const notes = pgTable("notes", {
	id: serial().primaryKey().notNull(),
	note: text().notNull(),
	userId: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "notes_userId_user_id_fk"
		}).onDelete("set null"),
]);

export const projects = pgTable("projects", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	business: integer(),
	code: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_project_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const collectionsTags = pgTable("collections_tags", {
	id: serial().primaryKey().notNull(),
	collectionId: integer().notNull(),
	tagId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("collections_tags_collectionId_idx").using("btree", table.collectionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "collections_tags_collectionId_collections_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "collections_tags_tagId_tags_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	userId: text().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("notifications_read_idx").using("btree", table.read.asc().nullsLast().op("bool_ops")),
	index("notifications_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "notifications_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const chatMessages = pgTable("chat_messages", {
	id: serial().primaryKey().notNull(),
	userId: text().notNull(),
	message: text().notNull(),
	chatRoomId: text().notNull(),
	categoryId: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("chat_messages_categoryId_idx").using("btree", table.categoryId.asc().nullsLast().op("int4_ops")),
	index("chat_messages_chatRoomId_idx").using("btree", table.chatRoomId.asc().nullsLast().op("text_ops")),
	index("chat_messages_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_messages_userId_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [chatCategories.id],
			name: "chat_messages_categoryId_chat_categories_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const chatCategories = pgTable("chat_categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	enabled: boolean().default(true).notNull(),
	icon: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("chat_categories_enabled_idx").using("btree", table.enabled.asc().nullsLast().op("bool_ops")),
	uniqueIndex("unique_chat_category_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const osFamily = pgTable("os_family", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("unique_os_family_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const bookingCodeGroups = pgTable("booking_code_groups", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("unique_booking_code_group_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const bookingCodes = pgTable("booking_codes", {
	id: serial().primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	code: text().notNull(),
	description: text(),
	validFrom: timestamp("valid_from", { withTimezone: true, mode: 'string' }).notNull(),
	validTo: timestamp("valid_to", { withTimezone: true, mode: 'string' }).notNull(),
	enabled: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("booking_code_group_id_idx").using("btree", table.groupId.asc().nullsLast().op("int4_ops")),
	index("booking_code_validity_idx").using("btree", table.validFrom.asc().nullsLast().op("timestamptz_ops"), table.validTo.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("unique_booking_code_in_timeframe_idx").using("btree", table.groupId.asc().nullsLast().op("timestamptz_ops"), table.code.asc().nullsLast().op("int4_ops"), table.validFrom.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [bookingCodeGroups.id],
			name: "booking_codes_group_id_booking_code_groups_id_fk"
		}).onDelete("cascade"),
]);

export const projectBookingCodes = pgTable("project_booking_codes", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	bookingCodeGroupId: integer("booking_code_group_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("project_booking_codes_group_id_idx").using("btree", table.bookingCodeGroupId.asc().nullsLast().op("int4_ops")),
	index("project_booking_codes_project_id_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_project_booking_code_group_idx").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.bookingCodeGroupId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_booking_codes_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.bookingCodeGroupId],
			foreignColumns: [bookingCodeGroups.id],
			name: "project_booking_codes_booking_code_group_id_booking_code_groups"
		}).onDelete("cascade"),
]);

export const softwareWhitelistVersions = pgTable("software_whitelist_versions", {
	id: serial().primaryKey().notNull(),
	softwareWhitelistId: integer("software_whitelist_id").notNull(),
	versionPattern: text("version_pattern").notNull(),
	description: text(),
	releaseDate: timestamp("release_date", { withTimezone: true, mode: 'string' }),
	isApproved: boolean("is_approved").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("software_version_whitelist_idx").using("btree", table.softwareWhitelistId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_software_version_idx").using("btree", table.softwareWhitelistId.asc().nullsLast().op("int4_ops"), table.versionPattern.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.softwareWhitelistId],
			foreignColumns: [softwareWhitelist.id],
			name: "software_whitelist_versions_software_whitelist_id_software_whit"
		}).onDelete("cascade"),
]);

export const softwareWhitelist = pgTable("software_whitelist", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	osFamilyId: integer("os_family_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	versionInfo: text("version_info"),
}, (table) => [
	index("software_whitelist_osfamily_idx").using("btree", table.osFamilyId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_software_name_osfamily_idx").using("btree", table.name.asc().nullsLast().op("int4_ops"), table.osFamilyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.osFamilyId],
			foreignColumns: [osFamily.id],
			name: "software_whitelist_os_family_id_os_family_id_fk"
		}).onDelete("cascade"),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
]);

export const authenticator = pgTable("authenticator", {
	credentialId: text().notNull(),
	userId: text().notNull(),
	providerAccountId: text().notNull(),
	credentialPublicKey: text().notNull(),
	counter: integer().notNull(),
	credentialDeviceType: text().notNull(),
	credentialBackedUp: boolean().notNull(),
	transports: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "authenticator_userId_user_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.credentialId, table.userId], name: "authenticator_userId_credentialID_pk"}),
]);

export const account = pgTable("account", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
]);
