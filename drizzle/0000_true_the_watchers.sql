CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`docLink` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_application_name_idx` ON `applications` (`name`);--> statement-breakpoint
CREATE TABLE `applications_servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`applicationId` integer NOT NULL,
	`serverId` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_server_application_id_server_id_idx` ON `applications_servers` (`applicationId`,`serverId`);--> statement-breakpoint
CREATE INDEX `applications_server_application_id_idx` ON `applications_servers` (`applicationId`);--> statement-breakpoint
CREATE INDEX `applications_server_server_id_idx` ON `applications_servers` (`serverId`);--> statement-breakpoint
CREATE TABLE `authenticator` (
	`credentialID` text NOT NULL,
	`userId` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`credentialPublicKey` text NOT NULL,
	`counter` integer NOT NULL,
	`credentialDeviceType` text NOT NULL,
	`credentialBackedUp` integer NOT NULL,
	`transports` text,
	PRIMARY KEY(`userId`, `credentialID`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `business` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_business_name_idx` ON `business` (`name`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_collection_name_idx` ON `collections` (`name`);--> statement-breakpoint
CREATE TABLE `collections_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collectionId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`collectionId`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_tag_collection_id_tag_id_idx` ON `collections_tags` (`collectionId`,`tagId`);--> statement-breakpoint
CREATE INDEX `collections_tag_collection_id_idx` ON `collections_tags` (`collectionId`);--> statement-breakpoint
CREATE INDEX `collections_tag_tag_id_idx` ON `collections_tags` (`tagId`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contactName` text,
	`contactEmail` text,
	`contactPhone` text,
	`address` text,
	`description` text,
	`latitude` text,
	`longitude` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_location_name_idx` ON `locations` (`name`);--> statement-breakpoint
CREATE TABLE `os` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`eol_date` text NOT NULL,
	`description` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_os_name_idx` ON `os` (`name`);--> statement-breakpoint
CREATE TABLE `patching_policy` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`responsibility` integer NOT NULL,
	`description` text,
	`dayOfWeek` text,
	`weekOfMonth` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `patching_policy_name_idx` ON `patching_policy` (`name`);--> statement-breakpoint
CREATE INDEX `patching_policy_responsibility_idx` ON `patching_policy` (`responsibility`);--> statement-breakpoint
CREATE TABLE `patching_policy_responsibility` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_responsibility_name_idx` ON `patching_policy_responsibility` (`name`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`authorId` text NOT NULL,
	`serverId` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `post_author_id_idx` ON `posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `post_server_id_idx` ON `posts` (`serverId`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`business` integer,
	`code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_project_name_idx` ON `projects` (`name`);--> statement-breakpoint
CREATE TABLE `servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`hostname` text NOT NULL,
	`ipv4` text,
	`ipv6` text,
	`description` text,
	`docLink` text,
	`business` integer,
	`itar` integer NOT NULL,
	`secureServer` integer NOT NULL,
	`osId` integer,
	`locationId` integer,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`osId`) REFERENCES `os`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_server_hostname_idx` ON `servers` (`hostname`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_server_ipv4_idx` ON `servers` (`ipv4`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_server_ipv6_idx` ON `servers` (`ipv6`);--> statement-breakpoint
CREATE INDEX `server_project_id_idx` ON `servers` (`projectId`);--> statement-breakpoint
CREATE INDEX `server_business_id_idx` ON `servers` (`business`);--> statement-breakpoint
CREATE TABLE `servers_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serverId` integer NOT NULL,
	`collectionId` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `servers_collection_server_id_collection_id_idx` ON `servers_collections` (`serverId`,`collectionId`);--> statement-breakpoint
CREATE INDEX `servers_collection_server_id_idx` ON `servers_collections` (`serverId`);--> statement-breakpoint
CREATE INDEX `servers_collection_collection_id_idx` ON `servers_collections` (`collectionId`);--> statement-breakpoint
CREATE TABLE `servers_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serverId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `servers_tag_server_id_tag_id_idx` ON `servers_tags` (`serverId`,`tagId`);--> statement-breakpoint
CREATE INDEX `servers_tag_server_id_idx` ON `servers_tags` (`serverId`);--> statement-breakpoint
CREATE INDEX `servers_tag_tag_id_idx` ON `servers_tags` (`tagId`);--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_tag_name_idx` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `users_servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`serverId` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_server_user_id_server_id_idx` ON `users_servers` (`userId`,`serverId`);--> statement-breakpoint
CREATE INDEX `users_server_user_id_idx` ON `users_servers` (`userId`);--> statement-breakpoint
CREATE INDEX `users_server_server_id_idx` ON `users_servers` (`serverId`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
