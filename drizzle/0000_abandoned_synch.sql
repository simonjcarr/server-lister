CREATE TYPE "public"."serverTypeEnum" AS ENUM('Physical', 'Virtual');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications_servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicationId" integer NOT NULL,
	"serverId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID")
);
--> statement-breakpoint
CREATE TABLE "business" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"expires_at" timestamp with time zone NOT NULL,
	"requested_by" text NOT NULL,
	"request_id" text,
	"requested_by_id" text,
	"csr" text NOT NULL,
	"cert" text NOT NULL,
	"key" text NOT NULL,
	"primary_domain" text NOT NULL,
	"other_domains" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"collectionId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"latitude" text,
	"longitude" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" text NOT NULL,
	"userId" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "os" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"eol_date" timestamp with time zone NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patching_policy" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"responsibility" integer NOT NULL,
	"description" text,
	"dayOfWeek" text,
	"weekOfMonth" integer,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patching_policy_responsibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" integer NOT NULL,
	"content" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business" integer,
	"code" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_certs" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" integer NOT NULL,
	"certId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ownerId" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" integer NOT NULL,
	"noteId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_collection_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"collectionId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"hostname" text NOT NULL,
	"ipv4" text,
	"ipv6" text,
	"description" text,
	"docLink" text,
	"business" integer,
	"itar" boolean NOT NULL,
	"secureServer" boolean NOT NULL,
	"osId" integer,
	"locationId" integer,
	"serverType" "serverTypeEnum",
	"cores" integer,
	"ram" integer,
	"diskSpace" integer,
	"rack" text,
	"position" text,
	"serial" text,
	"assetTag" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" integer NOT NULL,
	"collectionId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"roles" json DEFAULT '[]'::json,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"serverId" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications_servers" ADD CONSTRAINT "applications_servers_applicationId_applications_id_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications_servers" ADD CONSTRAINT "applications_servers_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certs" ADD CONSTRAINT "certs_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certs" ADD CONSTRAINT "certs_requested_by_id_user_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections_tags" ADD CONSTRAINT "collections_tags_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections_tags" ADD CONSTRAINT "collections_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_certs" ADD CONSTRAINT "server_certs_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_certs" ADD CONSTRAINT "server_certs_certId_certs_id_fk" FOREIGN KEY ("certId") REFERENCES "public"."certs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_groups" ADD CONSTRAINT "server_groups_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_notes" ADD CONSTRAINT "server_notes_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_notes" ADD CONSTRAINT "server_notes_noteId_notes_id_fk" FOREIGN KEY ("noteId") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_collection_subscriptions" ADD CONSTRAINT "server_collection_subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_collection_subscriptions" ADD CONSTRAINT "server_collection_subscriptions_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_osId_os_id_fk" FOREIGN KEY ("osId") REFERENCES "public"."os"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers_collections" ADD CONSTRAINT "servers_collections_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers_collections" ADD CONSTRAINT "servers_collections_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers_tags" ADD CONSTRAINT "servers_tags_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers_tags" ADD CONSTRAINT "servers_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_servers" ADD CONSTRAINT "users_servers_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_servers" ADD CONSTRAINT "users_servers_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_application_name_idx" ON "applications" USING btree ("name");--> statement-breakpoint
CREATE INDEX "applications_servers_applicationId_idx" ON "applications_servers" USING btree ("applicationId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_business_name_idx" ON "business" USING btree ("name");--> statement-breakpoint
CREATE INDEX "requested_by_idx" ON "certs" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "request_id_idx" ON "certs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "expires_at_idx" ON "certs" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_collection_name_idx" ON "collections" USING btree ("name");--> statement-breakpoint
CREATE INDEX "collections_tags_collectionId_idx" ON "collections_tags" USING btree ("collectionId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_location_name_idx" ON "locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "notes" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_os_name_idx" ON "os" USING btree ("name");--> statement-breakpoint
CREATE INDEX "patching_policy_name_idx" ON "patching_policy" USING btree ("name");--> statement-breakpoint
CREATE INDEX "patching_policy_responsibility_idx" ON "patching_policy" USING btree ("responsibility");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_responsibility_name_idx" ON "patching_policy_responsibility" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_post_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_serverId_idx" ON "posts" USING btree ("serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_name_idx" ON "projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "server_id_idx" ON "server_certs" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "cert_id_idx" ON "server_certs" USING btree ("certId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_group_name_idx" ON "server_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "server_groups_ownerId_idx" ON "server_groups" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "server_notes_server_id_idx" ON "server_notes" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "server_notes_note_id_idx" ON "server_notes" USING btree ("noteId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_collection_idx" ON "server_collection_subscriptions" USING btree ("userId","collectionId");--> statement-breakpoint
CREATE INDEX "server_collection_subscriptions_collectionId_idx" ON "server_collection_subscriptions" USING btree ("collectionId");--> statement-breakpoint
CREATE INDEX "server_collection_subscriptions_userId_idx" ON "server_collection_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_hostname_idx" ON "servers" USING btree ("hostname");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_ipv4_idx" ON "servers" USING btree ("ipv4") WHERE ipv4 IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_ipv6_idx" ON "servers" USING btree ("ipv6") WHERE ipv6 IS NOT NULL;--> statement-breakpoint
CREATE INDEX "server_project_id_idx" ON "servers" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "server_business_id_idx" ON "servers" USING btree ("business");--> statement-breakpoint
CREATE INDEX "servers_collections_serverId_idx" ON "servers_collections" USING btree ("serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_collection_idx" ON "servers_collections" USING btree ("serverId","collectionId");--> statement-breakpoint
CREATE INDEX "servers_tags_serverId_idx" ON "servers_tags" USING btree ("serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tag_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "users_servers_serverId_idx" ON "users_servers" USING btree ("serverId");