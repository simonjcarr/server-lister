'use server';

import db from "@/db/getdb";
import { servers, os, locations, business, bookingCodeGroups, bookingCodes } from "@/db/schema";
import { count, eq } from "drizzle-orm";

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

export type BookingCodeStatus = 'expired' | 'expiring_soon' | 'no_codes' | 'active';

export interface BookingCodeStatusCounts {
  expired: number;
  expiringSoon: number;
  noCodes: number;
  active: number;
}

export async function getBookingCodeStatusCounts(): Promise<BookingCodeStatusCounts> {
  try {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);
    
    // First, get all booking code groups
    const allGroups = await db
      .select({
        id: bookingCodeGroups.id,
      })
      .from(bookingCodeGroups);

    // Initialize counters
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let noCodesCount = 0;
    let activeCount = 0;
    
    // Process each group to determine its status
    for (const group of allGroups) {
      // Get all codes for this group
      const codesForGroup = await db
        .select({
          id: bookingCodes.id,
          validTo: bookingCodes.validTo,
        })
        .from(bookingCodes)
        .where(eq(bookingCodes.groupId, group.id));
      
      if (codesForGroup.length === 0) {
        // No booking codes in this group
        noCodesCount++;
        continue;
      }
      
      // Check if all codes have expired
      const allExpired = codesForGroup.every(code => new Date(code.validTo) < now);
      if (allExpired) {
        expiredCount++;
        continue;
      }
      
      // Check if all valid codes will expire within a month
      const validCodes = codesForGroup.filter(code => new Date(code.validTo) >= now);
      const allExpiringSoon = validCodes.every(code => new Date(code.validTo) < oneMonthFromNow);
      if (allExpiringSoon) {
        expiringSoonCount++;
        continue;
      }
      
      // If we get here, the group has at least one code that is valid beyond one month
      activeCount++;
    }
    
    return {
      expired: expiredCount,
      expiringSoon: expiringSoonCount,
      noCodes: noCodesCount,
      active: activeCount
    };
  } catch (error) {
    console.error("Error getting booking code status counts:", error);
    return {
      expired: 0,
      expiringSoon: 0,
      noCodes: 0,
      active: 0
    };
  }
}

export async function getDashboardStats() {
  // Get all stats in parallel for efficiency
  const [totalCount, nonOnboardedCount, itarCount, bookingCodeStatusCounts] = await Promise.all([
    getTotalServerCount(),
    getNonOnboardedServerCount(),
    getItarServerCount(),
    getBookingCodeStatusCounts()
  ]);
  
  return {
    totalServers: totalCount.count,
    nonOnboardedServers: nonOnboardedCount.count,
    itarServers: itarCount.count,
    bookingCodeStatuses: bookingCodeStatusCounts
  };
}