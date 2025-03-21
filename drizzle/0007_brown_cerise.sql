CREATE TYPE "public"."status" AS ENUM('Pending', 'Ordered', 'Ready');--> statement-breakpoint
ALTER TABLE "certs" ADD COLUMN "status" "status" DEFAULT 'Pending' NOT NULL;