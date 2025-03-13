-- Convert created_at and updated_at columns to timestamp with time zone
ALTER TABLE "user" 
  ALTER COLUMN "created_at" TYPE timestamp with time zone USING "created_at"::timestamp with time zone,
  ALTER COLUMN "updated_at" TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;

-- Convert other tables' timestamp fields to text
ALTER TABLE "projects"
  ALTER COLUMN "created_at" TYPE text,
  ALTER COLUMN "updated_at" TYPE text;

ALTER TABLE "business"
  ALTER COLUMN "created_at" TYPE text,
  ALTER COLUMN "updated_at" TYPE text;

ALTER TABLE "patching_policy_responsibility"
  ALTER COLUMN "created_at" TYPE text,
  ALTER COLUMN "updated_at" TYPE text;
