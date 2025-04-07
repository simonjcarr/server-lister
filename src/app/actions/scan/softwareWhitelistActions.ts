'use server';

import { areVersionsEquivalent } from "@/lib/utils/versionComparison";

import { db } from "@/db";
import { sql } from "drizzle-orm";

interface WhitelistSoftwareInfo {
  name: string;
  scannedVersion: string;
  latestWhitelistVersion: string | null;
  isUpToDate: boolean;
  daysOutOfDate: number | null;
  installLocation: string;
}



export async function getServerSoftwareWithWhitelist(serverId: number, filterByWhitelist: boolean = true) {
  try {
    if (!filterByWhitelist) {
      // All software with whitelist data where available
      const queryResult = await db.execute(sql`
        WITH software AS (
          SELECT 
            s->>'name' AS software_name,
            s->>'version' AS installed_version,
            s->>'install_location' AS install_location
          FROM server_scans sc
          CROSS JOIN LATERAL jsonb_array_elements(sc."scanResults"->'software') AS s
          WHERE sc."serverId" = ${serverId}
        )
        SELECT 
          s.software_name,
          s.installed_version,
          s.install_location,
          wl."name" AS whitelist_name,
          COALESCE(swv.version_pattern, NULL) AS whitelist_version,
          swv.release_date AS whitelist_release_date,
          swv_latest.version_pattern AS latest_whitelist_version,
          swv_latest.release_date AS latest_release_date,
          CASE 
            WHEN swv_latest.release_date IS NOT NULL AND swv.release_date IS NOT NULL 
            THEN (swv_latest.release_date::date - swv.release_date::date) 
            ELSE NULL 
          END AS days_difference,
          CASE 
            WHEN swv_latest.version_pattern IS NOT NULL 
                AND s.installed_version = swv_latest.version_pattern THEN 1 
            ELSE 0 
          END AS "up to date"
        FROM software s
        LEFT JOIN servers srv ON srv.id = ${serverId}
        LEFT JOIN os ON os.id = srv."osId"
        LEFT JOIN os_family ON os_family.id = os.os_family_id
        LEFT JOIN software_whitelist wl ON 
          LOWER(s.software_name) = LOWER(wl."name") AND
          os_family.id = wl.os_family_id
        LEFT JOIN LATERAL (
            SELECT swv2.version_pattern, swv2.release_date
            FROM software_whitelist_versions swv2
            WHERE s.installed_version = swv2.version_pattern
              AND swv2.software_whitelist_id = wl.id
            ORDER BY swv2.release_date DESC
            LIMIT 1
        ) swv ON true
        LEFT JOIN LATERAL (
            SELECT swv_latest.version_pattern, swv_latest.release_date
            FROM software_whitelist_versions swv_latest
            WHERE swv_latest.software_whitelist_id = wl.id
            ORDER BY swv_latest.release_date DESC
            LIMIT 1
        ) swv_latest ON true
      `);

      // Transform the SQL result into the expected format
      const result: WhitelistSoftwareInfo[] = queryResult.rows.map(row => {
        // Check if versions are equivalent using our utility function
        let isUpToDate = row["up to date"] === 1;
        
        // If there's a whitelist version to compare against and not already up to date based on exact match
        if (row.latest_whitelist_version && !isUpToDate) {
          // Use our version comparison function to check for equivalence
          isUpToDate = areVersionsEquivalent(
            row.installed_version as string, 
            row.latest_whitelist_version as string
          );
        }
        
        return {
          name: row.software_name as string,
          scannedVersion: row.installed_version as string,
          latestWhitelistVersion: row.latest_whitelist_version as string || null,
          isUpToDate,
          daysOutOfDate: row.days_difference !== null ? Number(row.days_difference) : null,
          installLocation: row.install_location as string || "",
        };
      });
      
      return result;
    } else {
      // Whitelist only software
      const queryResult = await db.execute(sql`
        SELECT 
          srv.id AS serverId, 
          s->>'name' AS software_name,
          s->>'version' AS installed_version,
          s->>'install_location' AS install_location,
          wl."name" AS whitelist_name,
          COALESCE(swv.version_pattern, 'NO DATA') AS whitelist_version,
          swv.release_date AS whitelist_release_date,
          swv_latest.version_pattern AS latest_whitelist_version,
          swv_latest.release_date AS latest_release_date,
          (swv_latest.release_date::date - swv.release_date::date) AS days_difference,
          CASE 
            WHEN swv_latest.version_pattern IS NOT NULL 
                AND s->>'version' = swv_latest.version_pattern THEN 1 
            ELSE 0 
          END AS "up to date"
        FROM software_whitelist wl
        JOIN server_scans sc ON true
        JOIN LATERAL jsonb_array_elements(sc."scanResults"->'software') AS s
            ON s->>'name' = wl."name"
        LEFT JOIN LATERAL (
            SELECT swv2.version_pattern, swv2.release_date
            FROM software_whitelist_versions swv2
            WHERE s->>'version' = swv2.version_pattern
            ORDER BY swv2.release_date DESC
            LIMIT 1
        ) swv ON true
        LEFT JOIN LATERAL (
            SELECT swv_latest.version_pattern, swv_latest.release_date
            FROM software_whitelist_versions swv_latest
            WHERE swv_latest.software_whitelist_id = wl.id
            ORDER BY swv_latest.release_date DESC
            LIMIT 1
        ) swv_latest ON true
        LEFT JOIN servers srv ON srv.id = sc."serverId"
        LEFT JOIN os ON os.id = srv."osId"
        LEFT JOIN os_family ON os_family.id = os.os_family_id
        WHERE 
            os.os_family_id = wl.os_family_id 
            AND srv.id = ${serverId};
      `);

      // Transform the SQL result into the expected format
      const result: WhitelistSoftwareInfo[] = queryResult.rows.map(row => {
        // Check if versions are equivalent using our utility function
        let isUpToDate = row["up to date"] === 1;
        
        // If there's a whitelist version to compare against and not already up to date based on exact match
        if (row.latest_whitelist_version && !isUpToDate) {
          // Use our version comparison function to check for equivalence
          isUpToDate = areVersionsEquivalent(
            row.installed_version as string, 
            row.latest_whitelist_version as string
          );
        }
        
        return {
          name: row.software_name as string,
          scannedVersion: row.installed_version as string,
          latestWhitelistVersion: row.latest_whitelist_version as string,
          isUpToDate,
          daysOutOfDate: row.days_difference !== null ? Number(row.days_difference) : null,
          installLocation: row.install_location as string || "",
        };
      });
      
      return result;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get server software with whitelist information");
  }
}
