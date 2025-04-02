import { relations } from "drizzle-orm/relations";
import { user, serverGroups, os, osPatchVersions, osFamily, projects, projectDrawings, drawings, applications, applicationsServers, servers, usersServers, posts, serversTags, tags, locations, serverDrawings, serverNotes, notes, serverScans, serverCollectionSubscriptions, collections, serversCollections, session, certs, collectionsTags, notifications, chatMessages, chatCategories, bookingCodeGroups, bookingCodes, projectBookingCodes, softwareWhitelist, softwareWhitelistVersions, authenticator, account } from "./schema";

export const serverGroupsRelations = relations(serverGroups, ({one}) => ({
	user: one(user, {
		fields: [serverGroups.ownerId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	serverGroups: many(serverGroups),
	usersServers: many(usersServers),
	serverCollectionSubscriptions: many(serverCollectionSubscriptions),
	sessions: many(session),
	certs: many(certs),
	notes: many(notes),
	notifications: many(notifications),
	chatMessages: many(chatMessages),
	authenticators: many(authenticator),
	accounts: many(account),
}));

export const osPatchVersionsRelations = relations(osPatchVersions, ({one}) => ({
	o: one(os, {
		fields: [osPatchVersions.osId],
		references: [os.id]
	}),
}));

export const osRelations = relations(os, ({one, many}) => ({
	osPatchVersions: many(osPatchVersions),
	osFamily: one(osFamily, {
		fields: [os.osFamilyId],
		references: [osFamily.id]
	}),
	servers: many(servers),
}));

export const osFamilyRelations = relations(osFamily, ({many}) => ({
	os: many(os),
	softwareWhitelists: many(softwareWhitelist),
}));

export const projectDrawingsRelations = relations(projectDrawings, ({one}) => ({
	project: one(projects, {
		fields: [projectDrawings.projectId],
		references: [projects.id]
	}),
	drawing: one(drawings, {
		fields: [projectDrawings.drawingId],
		references: [drawings.id]
	}),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	projectDrawings: many(projectDrawings),
	servers: many(servers),
	projectBookingCodes: many(projectBookingCodes),
}));

export const drawingsRelations = relations(drawings, ({many}) => ({
	projectDrawings: many(projectDrawings),
	serverDrawings: many(serverDrawings),
}));

export const applicationsServersRelations = relations(applicationsServers, ({one}) => ({
	application: one(applications, {
		fields: [applicationsServers.applicationId],
		references: [applications.id]
	}),
	server: one(servers, {
		fields: [applicationsServers.serverId],
		references: [servers.id]
	}),
}));

export const applicationsRelations = relations(applications, ({many}) => ({
	applicationsServers: many(applicationsServers),
}));

export const serversRelations = relations(servers, ({one, many}) => ({
	applicationsServers: many(applicationsServers),
	usersServers: many(usersServers),
	posts: many(posts),
	serversTags: many(serversTags),
	project: one(projects, {
		fields: [servers.projectId],
		references: [projects.id]
	}),
	o: one(os, {
		fields: [servers.osId],
		references: [os.id]
	}),
	location: one(locations, {
		fields: [servers.locationId],
		references: [locations.id]
	}),
	serverDrawings: many(serverDrawings),
	serverNotes: many(serverNotes),
	serverScans: many(serverScans),
	serversCollections: many(serversCollections),
	certs: many(certs),
}));

export const usersServersRelations = relations(usersServers, ({one}) => ({
	user: one(user, {
		fields: [usersServers.userId],
		references: [user.id]
	}),
	server: one(servers, {
		fields: [usersServers.serverId],
		references: [servers.id]
	}),
}));

export const postsRelations = relations(posts, ({one}) => ({
	server: one(servers, {
		fields: [posts.serverId],
		references: [servers.id]
	}),
}));

export const serversTagsRelations = relations(serversTags, ({one}) => ({
	server: one(servers, {
		fields: [serversTags.serverId],
		references: [servers.id]
	}),
	tag: one(tags, {
		fields: [serversTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	serversTags: many(serversTags),
	collectionsTags: many(collectionsTags),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	servers: many(servers),
}));

export const serverDrawingsRelations = relations(serverDrawings, ({one}) => ({
	server: one(servers, {
		fields: [serverDrawings.serverId],
		references: [servers.id]
	}),
	drawing: one(drawings, {
		fields: [serverDrawings.drawingId],
		references: [drawings.id]
	}),
}));

export const serverNotesRelations = relations(serverNotes, ({one}) => ({
	server: one(servers, {
		fields: [serverNotes.serverId],
		references: [servers.id]
	}),
	note: one(notes, {
		fields: [serverNotes.noteId],
		references: [notes.id]
	}),
}));

export const notesRelations = relations(notes, ({one, many}) => ({
	serverNotes: many(serverNotes),
	user: one(user, {
		fields: [notes.userId],
		references: [user.id]
	}),
}));

export const serverScansRelations = relations(serverScans, ({one}) => ({
	server: one(servers, {
		fields: [serverScans.serverId],
		references: [servers.id]
	}),
}));

export const serverCollectionSubscriptionsRelations = relations(serverCollectionSubscriptions, ({one}) => ({
	user: one(user, {
		fields: [serverCollectionSubscriptions.userId],
		references: [user.id]
	}),
	collection: one(collections, {
		fields: [serverCollectionSubscriptions.collectionId],
		references: [collections.id]
	}),
}));

export const collectionsRelations = relations(collections, ({many}) => ({
	serverCollectionSubscriptions: many(serverCollectionSubscriptions),
	serversCollections: many(serversCollections),
	collectionsTags: many(collectionsTags),
}));

export const serversCollectionsRelations = relations(serversCollections, ({one}) => ({
	server: one(servers, {
		fields: [serversCollections.serverId],
		references: [servers.id]
	}),
	collection: one(collections, {
		fields: [serversCollections.collectionId],
		references: [collections.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const certsRelations = relations(certs, ({one}) => ({
	user: one(user, {
		fields: [certs.requestedById],
		references: [user.id]
	}),
	server: one(servers, {
		fields: [certs.serverId],
		references: [servers.id]
	}),
}));

export const collectionsTagsRelations = relations(collectionsTags, ({one}) => ({
	collection: one(collections, {
		fields: [collectionsTags.collectionId],
		references: [collections.id]
	}),
	tag: one(tags, {
		fields: [collectionsTags.tagId],
		references: [tags.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	user: one(user, {
		fields: [chatMessages.userId],
		references: [user.id]
	}),
	chatCategory: one(chatCategories, {
		fields: [chatMessages.categoryId],
		references: [chatCategories.id]
	}),
}));

export const chatCategoriesRelations = relations(chatCategories, ({many}) => ({
	chatMessages: many(chatMessages),
}));

export const bookingCodesRelations = relations(bookingCodes, ({one}) => ({
	bookingCodeGroup: one(bookingCodeGroups, {
		fields: [bookingCodes.groupId],
		references: [bookingCodeGroups.id]
	}),
}));

export const bookingCodeGroupsRelations = relations(bookingCodeGroups, ({many}) => ({
	bookingCodes: many(bookingCodes),
	projectBookingCodes: many(projectBookingCodes),
}));

export const projectBookingCodesRelations = relations(projectBookingCodes, ({one}) => ({
	project: one(projects, {
		fields: [projectBookingCodes.projectId],
		references: [projects.id]
	}),
	bookingCodeGroup: one(bookingCodeGroups, {
		fields: [projectBookingCodes.bookingCodeGroupId],
		references: [bookingCodeGroups.id]
	}),
}));

export const softwareWhitelistVersionsRelations = relations(softwareWhitelistVersions, ({one}) => ({
	softwareWhitelist: one(softwareWhitelist, {
		fields: [softwareWhitelistVersions.softwareWhitelistId],
		references: [softwareWhitelist.id]
	}),
}));

export const softwareWhitelistRelations = relations(softwareWhitelist, ({one, many}) => ({
	softwareWhitelistVersions: many(softwareWhitelistVersions),
	osFamily: one(osFamily, {
		fields: [softwareWhitelist.osFamilyId],
		references: [osFamily.id]
	}),
}));

export const authenticatorRelations = relations(authenticator, ({one}) => ({
	user: one(user, {
		fields: [authenticator.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));