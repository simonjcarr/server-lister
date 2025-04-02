'use server';

import { db } from "@/db";
import { serverScans } from "@/db/schema";
import { softwareWhitelist, softwareWhitelistVersions } from "@/db/schema/softwareWhitelist";
import { osFamily } from "@/db/schema/osFamily";
import { eq, sql } from "drizzle-orm";
import { differenceInDays } from "date-fns";

interface WhitelistSoftwareInfo {
  name: string;
  scannedVersion: string;
  latestWhitelistVersion: string | null;
  isUpToDate: boolean;
  daysOutOfDate: number | null;
  installLocation: string;
}

/**
 * Normalize a software name for consistent comparison
 * Removes special characters, whitespace, and makes lowercase
 */
function normalizeSoftwareName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

export async function getServerSoftwareWithWhitelist(serverId: number, filterByWhitelist: boolean = true) {
  try {
    console.log(`Starting getServerSoftwareWithWhitelist for server ID: ${serverId}, filterByWhitelist: ${filterByWhitelist}`);
    
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

      console.log(`All software query result: ${queryResult.rows.length} rows`);
      
      // Transform the SQL result into the expected format
      const result: WhitelistSoftwareInfo[] = queryResult.rows.map(row => {
        // Convert the "up to date" value from numeric to boolean
        const isUpToDate = row["up to date"] === 1;
        
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

      console.log(`Whitelist only query result: ${queryResult.rows.length} rows`);      
      
      // Transform the SQL result into the expected format
      const result: WhitelistSoftwareInfo[] = queryResult.rows.map(row => {
        // Convert the "up to date" value from numeric to boolean
        const isUpToDate = row["up to date"] === 1;
        
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
