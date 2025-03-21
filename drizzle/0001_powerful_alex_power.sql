ALTER TABLE "certs" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certs" ALTER COLUMN "csr" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certs" ALTER COLUMN "cert" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certs" ALTER COLUMN "key" DROP NOT NULL;