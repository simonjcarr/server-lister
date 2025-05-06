-- Create engineer_hours table
CREATE TABLE IF NOT EXISTS "engineer_hours" (
  "id" SERIAL PRIMARY KEY,
  "server_id" INTEGER NOT NULL REFERENCES "servers"("id") ON DELETE CASCADE,
  "booking_code_id" INTEGER NOT NULL REFERENCES "booking_codes"("id") ON DELETE CASCADE,
  "minutes" INTEGER NOT NULL,
  "note" TEXT,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "engineer_hours_server_id_idx" ON "engineer_hours"("server_id");
CREATE INDEX IF NOT EXISTS "engineer_hours_booking_code_id_idx" ON "engineer_hours"("booking_code_id");
CREATE INDEX IF NOT EXISTS "engineer_hours_date_idx" ON "engineer_hours"("date");