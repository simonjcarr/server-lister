CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"feature_key" text NOT NULL,
	"preference_value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_userId_feature_key_unique" ON "user_preferences" ("userId", "feature_key");
