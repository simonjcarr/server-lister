CREATE TABLE "server_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"serverId" integer NOT NULL,
	"scanDate" timestamp with time zone NOT NULL,
	"scanResults" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "server_scans" ADD CONSTRAINT "server_scans_serverId_servers_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "server_id_idx" ON "server_scans" USING btree ("serverId");