-- Add user_id column to engineer_hours table
ALTER TABLE engineer_hours
ADD COLUMN user_id TEXT;

-- Create a foreign key constraint referencing the user table
ALTER TABLE engineer_hours
ADD CONSTRAINT fk_engineer_hours_user
FOREIGN KEY (user_id)
REFERENCES "user"(id)
ON DELETE SET NULL;

-- Create an index on user_id column for efficient lookups
CREATE INDEX engineer_hours_user_id_idx ON engineer_hours (user_id);

-- Initially set all existing records to a default admin user
-- Replace 'default-admin-id' with an actual admin user ID from your database
UPDATE engineer_hours
SET user_id = (SELECT id FROM "user" WHERE email = 'admin@example.com' LIMIT 1);

-- Make the column NOT NULL after populating it
ALTER TABLE engineer_hours
ALTER COLUMN user_id SET NOT NULL;