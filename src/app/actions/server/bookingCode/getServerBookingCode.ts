'use server';

import { db } from "@/db";
import { servers } from "@/db/schema/servers";
import { projectBookingCodes, bookingCodeGroups, bookingCodes } from "@/db/schema/bookingCodes";
import { and, eq, gte, lt, desc } from "drizzle-orm";

export type ServerBookingCodeResult = {
  code: string;
  description: string | null;
  groupName: string;
  isExpired: boolean;
  validFrom: Date;
  validTo: Date;
} | null;

export async function getServerBookingCode(serverId: number): Promise<ServerBookingCodeResult> {
  try {
    // Get the server to find its project
    const server = await db
      .select({ projectId: servers.projectId })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (server.length === 0 || !server[0].projectId) {
      return null; // Server not found or has no project
    }

    const projectId = server[0].projectId;

    // Get the booking code group assigned to the project
    const projectBookingCode = await db
      .select({
        bookingCodeGroupId: projectBookingCodes.bookingCodeGroupId,
        groupName: bookingCodeGroups.name,
      })
      .from(projectBookingCodes)
      .innerJoin(
        bookingCodeGroups,
        eq(projectBookingCodes.bookingCodeGroupId, bookingCodeGroups.id)
      )
      .where(eq(projectBookingCodes.projectId, projectId))
      .limit(1);

    if (projectBookingCode.length === 0) {
      return null; // No booking code group assigned to the project
    }

    const groupId = projectBookingCode[0].bookingCodeGroupId;
    const groupName = projectBookingCode[0].groupName;
    const now = new Date();

    // Try to get the currently active booking code
    const activeCode = await db
      .select({
        code: bookingCodes.code,
        description: bookingCodes.description,
        validFrom: bookingCodes.validFrom,
        validTo: bookingCodes.validTo,
      })
      .from(bookingCodes)
      .where(
        and(
          eq(bookingCodes.groupId, groupId),
          eq(bookingCodes.enabled, true),
          gte(bookingCodes.validTo, now),
          lt(bookingCodes.validFrom, now)
        )
      )
      .orderBy(desc(bookingCodes.validFrom))
      .limit(1);

    if (activeCode.length > 0) {
      return {
        ...activeCode[0],
        groupName,
        isExpired: false,
      };
    }

    // If no active code, get the most recent expired one
    const recentExpired = await db
      .select({
        code: bookingCodes.code,
        description: bookingCodes.description,
        validFrom: bookingCodes.validFrom,
        validTo: bookingCodes.validTo,
      })
      .from(bookingCodes)
      .where(
        and(
          eq(bookingCodes.groupId, groupId),
          lt(bookingCodes.validTo, now)
        )
      )
      .orderBy(desc(bookingCodes.validTo))
      .limit(1);

    if (recentExpired.length > 0) {
      return {
        ...recentExpired[0],
        groupName,
        isExpired: true,
      };
    }

    return null; // No booking codes found for this group
  } catch (error) {
    console.error("Error getting server booking code:", error);
    return null;
  }
}
