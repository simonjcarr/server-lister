-- Create OS Family table
CREATE TABLE IF NOT EXISTS os_family (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on OS Family name
CREATE UNIQUE INDEX IF NOT EXISTS unique_os_family_name_idx ON os_family(name);

-- Add OS Family ID column to OS table
ALTER TABLE os ADD COLUMN IF NOT EXISTS os_family_id INTEGER REFERENCES os_family(id);

-- Create index on OS Family ID for faster lookups
CREATE INDEX IF NOT EXISTS os_os_family_id_idx ON os(os_family_id);
