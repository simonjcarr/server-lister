ALTER TABLE "project_booking_codes" DROP CONSTRAINT "project_booking_codes_booking_code_group_id_booking_code_groups";
--> statement-breakpoint
ALTER TABLE "software_whitelist_versions" DROP CONSTRAINT "software_whitelist_versions_software_whitelist_id_software_whit";
--> statement-breakpoint
DROP INDEX "server_groups_ownerId_idx";--> statement-breakpoint
DROP INDEX "unique_server_group_name_idx";--> statement-breakpoint
DROP INDEX "os_patch_versions_osId_idx";--> statement-breakpoint
DROP INDEX "unique_location_name_idx";--> statement-breakpoint
DROP INDEX "unique_os_name_idx";--> statement-breakpoint
DROP INDEX "unique_project_drawing_idx";--> statement-breakpoint
DROP INDEX "drawings_name_idx";--> statement-breakpoint
DROP INDEX "unique_user_project_idx";--> statement-breakpoint
DROP INDEX "unique_project_link_server_idx";--> statement-breakpoint
DROP INDEX "project_links_name_idx";--> statement-breakpoint
DROP INDEX "unique_project_link_idx";--> statement-breakpoint
DROP INDEX "unique_project_link_name_idx";--> statement-breakpoint
DROP INDEX "unique_application_name_idx";--> statement-breakpoint
DROP INDEX "applications_servers_applicationId_idx";--> statement-breakpoint
DROP INDEX "unique_user_server_idx";--> statement-breakpoint
DROP INDEX "users_servers_serverId_idx";--> statement-breakpoint
DROP INDEX "users_servers_userId_idx";--> statement-breakpoint
DROP INDEX "post_serverId_idx";--> statement-breakpoint
DROP INDEX "unique_post_slug_idx";--> statement-breakpoint
DROP INDEX "servers_tags_serverId_idx";--> statement-breakpoint
DROP INDEX "server_business_id_idx";--> statement-breakpoint
DROP INDEX "server_project_id_idx";--> statement-breakpoint
DROP INDEX "unique_server_hostname_idx";--> statement-breakpoint
DROP INDEX "unique_server_ipv4_idx";--> statement-breakpoint
DROP INDEX "unique_server_ipv6_idx";--> statement-breakpoint
DROP INDEX "unique_server_drawing_idx";--> statement-breakpoint
DROP INDEX "server_notes_note_id_idx";--> statement-breakpoint
DROP INDEX "server_notes_server_id_idx";--> statement-breakpoint
DROP INDEX "server_id_idx";--> statement-breakpoint
DROP INDEX "unique_tag_name_idx";--> statement-breakpoint
DROP INDEX "server_collection_subscriptions_collectionId_idx";--> statement-breakpoint
DROP INDEX "server_collection_subscriptions_userId_idx";--> statement-breakpoint
DROP INDEX "unique_user_collection_idx";--> statement-breakpoint
DROP INDEX "servers_collections_serverId_idx";--> statement-breakpoint
DROP INDEX "unique_server_collection_idx";--> statement-breakpoint
DROP INDEX "unique_collection_name_idx";--> statement-breakpoint
DROP INDEX "unique_business_name_idx";--> statement-breakpoint
DROP INDEX "patching_policy_name_idx";--> statement-breakpoint
DROP INDEX "patching_policy_responsibility_idx";--> statement-breakpoint
DROP INDEX "expires_at_idx";--> statement-breakpoint
DROP INDEX "request_id_idx";--> statement-breakpoint
DROP INDEX "requested_by_idx";--> statement-breakpoint
DROP INDEX "unique_responsibility_name_idx";--> statement-breakpoint
DROP INDEX "user_id_idx";--> statement-breakpoint
DROP INDEX "unique_project_name_idx";--> statement-breakpoint
DROP INDEX "collections_tags_collectionId_idx";--> statement-breakpoint
DROP INDEX "notifications_read_idx";--> statement-breakpoint
DROP INDEX "notifications_user_id_idx";--> statement-breakpoint
DROP INDEX "chat_messages_categoryId_idx";--> statement-breakpoint
DROP INDEX "chat_messages_chatRoomId_idx";--> statement-breakpoint
DROP INDEX "chat_messages_user_id_idx";--> statement-breakpoint
DROP INDEX "chat_categories_enabled_idx";--> statement-breakpoint
DROP INDEX "unique_chat_category_name_idx";--> statement-breakpoint
DROP INDEX "unique_os_family_name_idx";--> statement-breakpoint
DROP INDEX "unique_booking_code_group_name_idx";--> statement-breakpoint
DROP INDEX "booking_code_group_id_idx";--> statement-breakpoint
DROP INDEX "booking_code_validity_idx";--> statement-breakpoint
DROP INDEX "unique_booking_code_in_timeframe_idx";--> statement-breakpoint
DROP INDEX "project_booking_codes_group_id_idx";--> statement-breakpoint
DROP INDEX "project_booking_codes_project_id_idx";--> statement-breakpoint
DROP INDEX "unique_project_booking_code_group_idx";--> statement-breakpoint
DROP INDEX "software_version_whitelist_idx";--> statement-breakpoint
DROP INDEX "unique_software_version_idx";--> statement-breakpoint
DROP INDEX "software_whitelist_osfamily_idx";--> statement-breakpoint
DROP INDEX "unique_software_name_osfamily_idx";--> statement-breakpoint
ALTER TABLE "project_booking_codes" ADD CONSTRAINT "project_booking_codes_booking_code_group_id_booking_code_groups_id_fk" FOREIGN KEY ("booking_code_group_id") REFERENCES "public"."booking_code_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_whitelist_versions" ADD CONSTRAINT "software_whitelist_versions_software_whitelist_id_software_whitelist_id_fk" FOREIGN KEY ("software_whitelist_id") REFERENCES "public"."software_whitelist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "server_groups_ownerId_idx" ON "server_groups" USING btree ("ownerId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_group_name_idx" ON "server_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "os_patch_versions_osId_idx" ON "os_patch_versions" USING btree ("osId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_location_name_idx" ON "locations" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_os_name_idx" ON "os" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_drawing_idx" ON "project_drawings" USING btree ("project_id","drawing_id");--> statement-breakpoint
CREATE INDEX "drawings_name_idx" ON "drawings" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_project_idx" ON "primary_project_engineers" USING btree ("userId","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_link_server_idx" ON "project_link_servers" USING btree ("project_link_id","server_id");--> statement-breakpoint
CREATE INDEX "project_links_name_idx" ON "project_links" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_link_idx" ON "project_links" USING btree ("project_id","link");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_link_name_idx" ON "project_links" USING btree ("project_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_application_name_idx" ON "applications" USING btree ("name");--> statement-breakpoint
CREATE INDEX "applications_servers_applicationId_idx" ON "applications_servers" USING btree ("applicationId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_server_idx" ON "users_servers" USING btree ("userId","serverId");--> statement-breakpoint
CREATE INDEX "users_servers_serverId_idx" ON "users_servers" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "users_servers_userId_idx" ON "users_servers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "post_serverId_idx" ON "posts" USING btree ("serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_post_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "servers_tags_serverId_idx" ON "servers_tags" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "server_business_id_idx" ON "servers" USING btree ("business");--> statement-breakpoint
CREATE INDEX "server_project_id_idx" ON "servers" USING btree ("projectId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_hostname_idx" ON "servers" USING btree ("hostname");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_ipv4_idx" ON "servers" USING btree ("ipv4") WHERE ipv4 IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_ipv6_idx" ON "servers" USING btree ("ipv6") WHERE ipv6 IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_drawing_idx" ON "server_drawings" USING btree ("server_id","drawing_id");--> statement-breakpoint
CREATE INDEX "server_notes_note_id_idx" ON "server_notes" USING btree ("noteId");--> statement-breakpoint
CREATE INDEX "server_notes_server_id_idx" ON "server_notes" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "server_id_idx" ON "server_scans" USING btree ("serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_tag_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "server_collection_subscriptions_collectionId_idx" ON "server_collection_subscriptions" USING btree ("collectionId");--> statement-breakpoint
CREATE INDEX "server_collection_subscriptions_userId_idx" ON "server_collection_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_collection_idx" ON "server_collection_subscriptions" USING btree ("userId","collectionId");--> statement-breakpoint
CREATE INDEX "servers_collections_serverId_idx" ON "servers_collections" USING btree ("serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_server_collection_idx" ON "servers_collections" USING btree ("serverId","collectionId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_collection_name_idx" ON "collections" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_business_name_idx" ON "business" USING btree ("name");--> statement-breakpoint
CREATE INDEX "patching_policy_name_idx" ON "patching_policy" USING btree ("name");--> statement-breakpoint
CREATE INDEX "patching_policy_responsibility_idx" ON "patching_policy" USING btree ("responsibility");--> statement-breakpoint
CREATE INDEX "expires_at_idx" ON "certs" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "request_id_idx" ON "certs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "requested_by_idx" ON "certs" USING btree ("requested_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_responsibility_name_idx" ON "patching_policy_responsibility" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "notes" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_name_idx" ON "projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "collections_tags_collectionId_idx" ON "collections_tags" USING btree ("collectionId");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_messages_categoryId_idx" ON "chat_messages" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "chat_messages_chatRoomId_idx" ON "chat_messages" USING btree ("chatRoomId");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_categories_enabled_idx" ON "chat_categories" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_chat_category_name_idx" ON "chat_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_os_family_name_idx" ON "os_family" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_booking_code_group_name_idx" ON "booking_code_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "booking_code_group_id_idx" ON "booking_codes" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "booking_code_validity_idx" ON "booking_codes" USING btree ("valid_from","valid_to");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_booking_code_in_timeframe_idx" ON "booking_codes" USING btree ("group_id","code","valid_from");--> statement-breakpoint
CREATE INDEX "project_booking_codes_group_id_idx" ON "project_booking_codes" USING btree ("booking_code_group_id");--> statement-breakpoint
CREATE INDEX "project_booking_codes_project_id_idx" ON "project_booking_codes" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_project_booking_code_group_idx" ON "project_booking_codes" USING btree ("project_id","booking_code_group_id");--> statement-breakpoint
CREATE INDEX "software_version_whitelist_idx" ON "software_whitelist_versions" USING btree ("software_whitelist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_software_version_idx" ON "software_whitelist_versions" USING btree ("software_whitelist_id","version_pattern");--> statement-breakpoint
CREATE INDEX "software_whitelist_osfamily_idx" ON "software_whitelist" USING btree ("os_family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_software_name_osfamily_idx" ON "software_whitelist" USING btree ("name","os_family_id");--> statement-breakpoint
ALTER TABLE "authenticator" DROP CONSTRAINT "authenticator_userId_credentialID_pk";
--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID");