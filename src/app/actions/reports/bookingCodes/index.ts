'use server';

import db from "@/db/getdb";
import { bookingCodeGroups, bookingCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export type BookingCodeStatusType = 'expired' | 'expiring_soon' | 'no_codes';

export interface BookingCodeStatusReport {
  groupId: number;
  groupName: string;
  codeId: number | null;
  code: string | null;
  description: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  status: BookingCodeStatusType;
  daysUntilExpiration: number | null;
}

export async function getBookingCodeStatusReport(): Promise<BookingCodeStatusReport[]> {
  try {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);
    
    // Get all booking code groups
    const allGroups = await db
      .select({
        id: bookingCodeGroups.id,
        name: bookingCodeGroups.name,
        description: bookingCodeGroups.description,
      })
      .from(bookingCodeGroups);
    
    const results: BookingCodeStatusReport[] = [];
    
    // Process each group to determine its status
    for (const group of allGroups) {
      // Get all codes for this group
      const codesForGroup = await db
        .select({
          id: bookingCodes.id,
          code: bookingCodes.code,
          description: bookingCodes.description,
          validFrom: bookingCodes.validFrom,
          validTo: bookingCodes.validTo,
        })
        .from(bookingCodes)
        .where(eq(bookingCodes.groupId, group.id));
      
      if (codesForGroup.length === 0) {
        // No booking codes in this group
        results.push({
          groupId: group.id,
          groupName: group.name,
          codeId: null,
          code: null,
          description: group.description,
          validFrom: null,
          validTo: null,
          status: 'no_codes',
          daysUntilExpiration: null
        });
        continue;
      }
      
      // Check if the group has any valid (not expired) booking codes
      const validCodes = codesForGroup.filter(code => {
        const validToDate = new Date(code.validTo);
        return validToDate >= now;
      });
      
      const hasValidCodes = validCodes.length > 0;
      
      // Sort valid codes by expiration date to find ones expiring soon
      if (hasValidCodes) {
        // Process codes that will expire within a month
        const soonExpiringCodes = validCodes.filter(code => {
          const validToDate = new Date(code.validTo);
          return validToDate < oneMonthFromNow;
        });
        
        for (const code of soonExpiringCodes) {
          const validToDate = new Date(code.validTo);
          results.push({
            groupId: group.id,
            groupName: group.name,
            codeId: code.id,
            code: code.code,
            description: code.description,
            validFrom: code.validFrom,
            validTo: code.validTo,
            status: 'expiring_soon',
            daysUntilExpiration: Math.floor((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      } else {
        // No valid codes, show only the most recently expired code
        const expiredCodes = codesForGroup.filter(code => {
          const validToDate = new Date(code.validTo);
          return validToDate < now;
        });
        
        // Sort expired codes by validTo date in descending order (most recent first)
        expiredCodes.sort((a, b) => {
          const dateA = new Date(a.validTo);
          const dateB = new Date(b.validTo);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Add only the most recently expired code
        if (expiredCodes.length > 0) {
          const mostRecentExpiredCode = expiredCodes[0];
          const validToDate = new Date(mostRecentExpiredCode.validTo);
          
          results.push({
            groupId: group.id,
            groupName: group.name,
            codeId: mostRecentExpiredCode.id,
            code: mostRecentExpiredCode.code,
            description: mostRecentExpiredCode.description,
            validFrom: mostRecentExpiredCode.validFrom,
            validTo: mostRecentExpiredCode.validTo,
            status: 'expired',
            daysUntilExpiration: -Math.floor((now.getTime() - validToDate.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error getting booking code status report:", error);
    return [];
  }
}
