ALTER TABLE "certs" DROP CONSTRAINT "certs_requested_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "certs" DROP COLUMN "requested_by";