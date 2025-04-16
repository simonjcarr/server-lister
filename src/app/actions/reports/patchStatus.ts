'use server'
import db from "@/db/getdb"; // Your database instance
import { sql } from "drizzle-orm";
import { PatchStatus } from "@/app/types/reports";

// Your original raw SQL query
const rawSqlQuery = sql`
-- CTE for the latest AVAILABLE patch version for each OS
WITH latest_os_patch AS (
  SELECT
    "osId",
    patch_version AS latest_available_patch, -- Renamed for clarity
    release_date AS latest_available_patch_date, -- Renamed for clarity
    ROW_NUMBER() OVER (PARTITION BY "osId" ORDER BY release_date DESC) as rn
  FROM
    os_patch_versions
),
-- CTE for the latest SCANNED patch version for each server
latest_server_scan AS (
  SELECT
    "serverId",
    -- Extract the currently scanned patch version from JSON
    "scanResults" -> 'os' ->> 'patch_version' AS current_scanned_patch, -- Renamed for clarity
    "scanDate",
    ROW_NUMBER() OVER (PARTITION BY "serverId" ORDER BY "scanDate" DESC) as rn
  FROM
    server_scans
)
-- Main query joining servers, latest available patches, and latest scanned patches
SELECT
  s.id AS server_id,
  s.hostname,
  o.name AS os_name, -- Display the OS name
  lss.current_scanned_patch, -- What the last scan found
  lop.latest_available_patch, -- What the latest patch defined for the OS is
  -- Calculate Patch Status based on comparison
  CASE
    -- If OS has no patches defined in os_patch_versions
    WHEN lop.latest_available_patch IS NULL THEN 'No OS Patch Data'
    -- If server hasn't been scanned or scan lacks OS patch info
    WHEN lss.current_scanned_patch IS NULL THEN 'No Scan Data'
    -- If scanned patch matches the latest available patch
    WHEN lss.current_scanned_patch = lop.latest_available_patch THEN 'Up to Date'
    -- Otherwise, the scanned patch is older than the latest available
    ELSE 'Out of Date'
  END AS patch_status,
  -- Calculate Days Behind ONLY if Out of Date
  CASE
    WHEN lop.latest_available_patch IS NULL THEN 0
    WHEN lss.current_scanned_patch IS NULL THEN 0
    WHEN lss.current_scanned_patch = lop.latest_available_patch THEN 0
    -- Calculate days difference from the latest available patch date
    ELSE DATE_PART('day', NOW() - lop.latest_available_patch_date)::INTEGER
  END AS days_behind
FROM
  servers s -- Start with all servers
-- Join with latest AVAILABLE patch data (using corrected osId)
LEFT JOIN
  latest_os_patch lop ON s."osId"::integer = lop."osId"::integer AND lop.rn = 1
-- Join with latest SCANNED data for this specific server
LEFT JOIN
  latest_server_scan lss ON s.id = lss."serverId"::integer AND lss.rn = 1

-- Join the os table on the servers table to get the os name
LEFT JOIN
  os o ON s."osId"::integer = o.id

ORDER BY
  s.hostname;
`;

// Execute the raw query
export async function getRawPatchStatus(): Promise<PatchStatus[]> {
  try {
    // Use db.execute for arbitrary SQL.
    // The result structure depends on the underlying driver (e.g., node-postgres).
    // It typically has a 'rows' property.
    const result = await db.execute(rawSqlQuery);

    // Assuming node-postgres, result.rows contains the array of results.
    // Cast the result rows to your defined type.
    const data = result.rows as PatchStatus[];

    return data;
  } catch (error) {
    console.error("Error executing raw SQL query:", error);
    throw error;
  }
}

// Example usage:
// getRawPatchStatus();
