'use server';

import { db } from "@/db";
import { servers, os, locations, business } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function getNonOnboardedServerCount() {
  try {
    const result = await db
      .select({ count: count() })
      .from(servers)
      .where(eq(servers.onboarded, false));
    
    return { count: Number(result[0].count) };
  } catch (error) {
    console.error("Error getting non-onboarded server count:", error);
    return { count: 0 };
  }
}

export async function getTotalServerCount() {
  try {
    const result = await db
      .select({ count: count() })
      .from(servers);
    
    return { count: Number(result[0].count) };
  } catch (error) {
    console.error("Error getting total server count:", error);
    return { count: 0 };
  }
}

export async function getServerCountsByOS() {
  try {
    const result = await db
      .select({
        osId: os.id,
        osName: os.name,
        count: count(),
      })
      .from(servers)
      .leftJoin(os, eq(servers.osId, os.id))
      .groupBy(os.id, os.name)
      .orderBy(count());
    
    return result.map(item => ({
      osId: item.osId,
      osName: item.osName || 'Unknown',
      count: Number(item.count)
    }));
  } catch (error) {
    console.error("Error getting server counts by OS:", error);
    return [];
  }
}

export async function getServerCountsByLocation() {
  try {
    const result = await db
      .select({
        locationId: locations.id,
        locationName: locations.name,
        count: count(),
      })
      .from(servers)
      .leftJoin(locations, eq(servers.locationId, locations.id))
      .groupBy(locations.id, locations.name)
      .orderBy(count());
    
    return result.map(item => ({
      locationId: item.locationId,
      locationName: item.locationName || 'Unknown',
      count: Number(item.count)
    }));
  } catch (error) {
    console.error("Error getting server counts by location:", error);
    return [];
  }
}

export async function getServerCountsByBusiness() {
  try {
    const result = await db
      .select({
        businessId: business.id,
        businessName: business.name,
        count: count(),
      })
      .from(servers)
      .leftJoin(business, eq(servers.business, business.id))
      .groupBy(business.id, business.name)
      .orderBy(count());
    
    return result.map(item => ({
      businessId: item.businessId,
      businessName: item.businessName || 'Unknown',
      count: Number(item.count)
    }));
  } catch (error) {
    console.error("Error getting server counts by business:", error);
    return [];
  }
}

export async function getSecureServerCount() {
  try {
    const result = await db
      .select({ count: count() })
      .from(servers)
      .where(eq(servers.secureServer, true));
    
    return { count: Number(result[0].count) };
  } catch (error) {
    console.error("Error getting secure server count:", error);
    return { count: 0 };
  }
}

export async function getItarServerCount() {
  try {
    const result = await db
      .select({ count: count() })
      .from(servers)
      .where(eq(servers.itar, true));
    
    return { count: Number(result[0].count) };
  } catch (error) {
    console.error("Error getting ITAR server count:", error);
    return { count: 0 };
  }
}

export async function getDashboardStats() {
  // Get all stats in parallel for efficiency
  const [totalCount, nonOnboardedCount, itarCount] = await Promise.all([
    getTotalServerCount(),
    getNonOnboardedServerCount(),
    getItarServerCount()
  ]);
  
  return {
    totalServers: totalCount.count,
    nonOnboardedServers: nonOnboardedCount.count,
    itarServers: itarCount.count,
  };
}
