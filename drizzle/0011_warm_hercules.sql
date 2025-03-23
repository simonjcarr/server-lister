CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"message" text NOT NULL,
	"chatRoomId" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "chat_messages_chatRoomId_idx" ON "chat_messages" USING btree ("chatRoomId");