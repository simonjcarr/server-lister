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
      // If not filtering by whitelist, use the original implementation
      // Get server scan results
      const scanResults = await db.select()
        .from(serverScans)
        .where(eq(serverScans.serverId, serverId))
        .limit(1);
        
      console.log(`Scan results found: ${scanResults.length > 0 ? 'Yes' : 'No'}`);

      if (!scanResults || scanResults.length === 0) {
        throw new Error("Server not found");
      }

      const serverSoftware = scanResults[0].scanResults.software;
      
      console.log(`Server software found: ${serverSoftware ? serverSoftware.length : 0} items`);
      // Log a sample of the first software item
      if (serverSoftware && serverSoftware.length > 0) {
        console.log('Sample software item:', JSON.stringify(serverSoftware[0], null, 2));
      }
      
      // Get OS family ID based on server's OS
      const serverOS = scanResults[0].scanResults.os;
      const osFamilyResult = await db.select()
        .from(osFamily)
        .where(sql`LOWER(${osFamily.name}) LIKE ${`%${serverOS.name.toLowerCase()}%`}`);
      
      const osFamilyId = osFamilyResult.length > 0 ? osFamilyResult[0].id : null;
      
      console.log(`Server OS: ${serverOS.name}, Detected OS Family ID: ${osFamilyId}`);
      
      if (!osFamilyId) {
        console.log(`Could not determine OS family for server ${serverId} with OS ${serverOS.name}`);
        // If we can't determine OS family, return everything or nothing depending on filter
        if (filterByWhitelist) {
          return []; // Return empty array when filtering by whitelist
        }
        
        // Otherwise return basic software list
        return serverSoftware.map(sw => ({
          name: sw.name,
          scannedVersion: sw.version,
          latestWhitelistVersion: null,
          isUpToDate: false,
          daysOutOfDate: null,
          installLocation: sw.install_location,
        }));
      }
      
      // Get whitelist software for this OS family
      const whitelistSoftware = await db.select({
        id: softwareWhitelist.id,
        name: softwareWhitelist.name,
        osFamilyId: softwareWhitelist.osFamilyId,
      })
      .from(softwareWhitelist)
      .where(eq(softwareWhitelist.osFamilyId, osFamilyId));
      
      console.log(`Server ID: ${serverId}, OS Family ID: ${osFamilyId}`);
      console.log(`Whitelist software count: ${whitelistSoftware.length}`);
      console.log(`Scanned software count: ${serverSoftware.length}`);
      
      if (filterByWhitelist && whitelistSoftware.length === 0) {
        console.log(`No whitelist software found for OS family ID ${osFamilyId}`);
        return [];
      }
      
      // Create a mapping of software names to whitelist IDs
      // We'll use both a basic map (for exact matches) and an array of normalized names for fuzzy matching
      const softwareNameToWhitelistId = new Map<string, number>();
      const normalizedWhitelistNames = new Map<string, {id: number, originalName: string}>();
      
      whitelistSoftware.forEach(item => {
        // For exact matches
        softwareNameToWhitelistId.set(item.name.toLowerCase().trim(), item.id);
        
        // For fuzzy/normalized matching
        const normalizedName = normalizeSoftwareName(item.name);
        normalizedWhitelistNames.set(normalizedName, {
          id: item.id,
          originalName: item.name
        });
        
        console.log(`Whitelist: ${item.name}, ID: ${item.id}, OS Family ID: ${item.osFamilyId}`);
      });
      
      // To properly filter when using the whitelist toggle,
      // we'll first identify which software matches the whitelist
      // and only include that if filterByWhitelist is true
      
      // Dump all normalized whitelist names for debugging
      console.log('Normalized whitelist names:');
      normalizedWhitelistNames.forEach((value, key) => {
        console.log(`  - ${key} => ${value.originalName} (ID: ${value.id})`);
      });
      
      // First, gather all potentially matching software
      const softwareToProcess = serverSoftware.filter(software => {
        if (!filterByWhitelist) {
          // If not filtering by whitelist, include all software
          return true;
        }
        
        // For logging
        const softwareNameLower = software.name.toLowerCase().trim();
        const normalizedSoftwareName = normalizeSoftwareName(software.name);
        
        // Try exact match first (case-insensitive but with spaces)
        const exactMatch = softwareNameToWhitelistId.has(softwareNameLower);
        
        // Try normalized match if no exact match
        const fuzzyMatch = normalizedWhitelistNames.has(normalizedSoftwareName);
        
        // Debug output
        console.log(`Software: ${software.name}`);
        console.log(`  - Lower: ${softwareNameLower}`);
        console.log(`  - Normalized: ${normalizedSoftwareName}`);
        console.log(`  - Exact match: ${exactMatch}`);
        console.log(`  - Fuzzy match: ${fuzzyMatch}`);
        
        return exactMatch || fuzzyMatch;
      });
      
      console.log(`After whitelist filtering: ${softwareToProcess.length} software items`);
      
      // Process each software item
      const result: WhitelistSoftwareInfo[] = [];
      
      for (const software of softwareToProcess) {
        let whitelistId: number | undefined;
        
        console.log(`Processing scanned software: ${software.name}, version: ${software.version}`);
        
        // Try exact match first (case-insensitive but with spaces)
        whitelistId = softwareNameToWhitelistId.get(software.name.toLowerCase().trim());
        if (whitelistId) {
          console.log(`Exact match found: ${software.name} matches whitelist ID ${whitelistId}`);
        }
        
        // If no exact match, try normalized match (no spaces/special chars)
        if (!whitelistId) {
          const normalizedSoftwareName = normalizeSoftwareName(software.name);
          const match = normalizedWhitelistNames.get(normalizedSoftwareName);
          
          if (match) {
            whitelistId = match.id;
            console.log(`Fuzzy match: "${software.name}" matches whitelist "${match.originalName}" (ID: ${match.id})`);
          } else {
            console.log(`No match found for ${software.name} (normalized: ${normalizedSoftwareName})`);
          }
        }
        
        let latestVersion = null;
        let isUpToDate = false;
        let daysOutOfDate = null;
        
        if (whitelistId) {
          // Get the latest version for this software from whitelist
          const versions = await db.select()
            .from(softwareWhitelistVersions)
            .where(eq(softwareWhitelistVersions.softwareWhitelistId, whitelistId))
            .orderBy(sql`${softwareWhitelistVersions.releaseDate} DESC`);
          
          if (versions.length > 0) {
            latestVersion = versions[0].versionPattern;
            
            // Check if current version matches the pattern
            isUpToDate = software.version === latestVersion;
            
            // Calculate days out of date if not up to date and release date exists
            if (!isUpToDate && versions[0].releaseDate) {
              daysOutOfDate = differenceInDays(new Date(), versions[0].releaseDate);
              daysOutOfDate = daysOutOfDate < 0 ? 0 : daysOutOfDate; // Ensure it's not negative
            }
          }
        }
        
        result.push({
          name: software.name,
          scannedVersion: software.version,
          latestWhitelistVersion: latestVersion,
          isUpToDate,
          daysOutOfDate,
          installLocation: software.install_location,
        });
      }
      
      return result;
    } else {
      // Using the new SQL query for whitelist only
      const queryResult = await db.execute(sql`
        SELECT 
          srv.id AS serverId, 
          s->>'name' AS software_name,
          s->>'version' AS installed_version,
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

      console.log(`SQL query result: ${queryResult.rows.length} rows`);      
      
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
          installLocation: "", // This field is not present in the SQL query, but required by the interface
        };
      });
      
      return result;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get server software with whitelist information");
  }
}
