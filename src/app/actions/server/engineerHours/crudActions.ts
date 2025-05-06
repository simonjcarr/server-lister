"use server";

import db from "@/db/getdb";
import {
  engineerHours,
  insertEngineerHoursSchema,
  updateEngineerHoursSchema,
} from "@/db/schema/engineerHours";
import { servers } from "@/db/schema/servers";
import { bookingCodes, projectBookingCodes, bookingCodeGroups } from "@/db/schema/bookingCodes";
import { desc, eq, count, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Define error type to replace any
type ErrorWithMessage = {
  message: string;
};

// EngineerHours CRUD operations
export async function createEngineerHours(data: {
  serverId: number;
  bookingCodeId: number;
  minutes: number;
  note?: string | null;
  date: Date;
}) {
  try {
    const validatedData = insertEngineerHoursSchema.parse({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.insert(engineerHours).values(validatedData).returning();
    revalidatePath(`/server/view/${data.serverId}`);
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error creating engineer hours:", typedError);
    return { success: false, error: typedError.message || "Failed to create engineer hours" };
  }
}

export async function updateEngineerHours(
  id: number,
  data: {
    minutes?: number;
    note?: string | null;
    date?: Date;
    bookingCodeId?: number;
  }
) {
  try {
    // Get the current record to get the serverId for revalidation
    const currentRecord = await db
      .select({ serverId: engineerHours.serverId })
      .from(engineerHours)
      .where(eq(engineerHours.id, id))
      .limit(1);

    if (currentRecord.length === 0) {
      return { success: false, error: "Engineer hours record not found" };
    }

    const validatedData = updateEngineerHoursSchema.parse({
      ...data,
      updatedAt: new Date(),
    });

    const result = await db
      .update(engineerHours)
      .set(validatedData)
      .where(eq(engineerHours.id, id))
      .returning();

    revalidatePath(`/server/view/${currentRecord[0].serverId}`);
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error updating engineer hours:", typedError);
    return { success: false, error: typedError.message || "Failed to update engineer hours" };
  }
}

export async function deleteEngineerHours(id: number) {
  try {
    // Get the current record to get the serverId for revalidation
    const currentRecord = await db
      .select({ serverId: engineerHours.serverId })
      .from(engineerHours)
      .where(eq(engineerHours.id, id))
      .limit(1);

    if (currentRecord.length === 0) {
      return { success: false, error: "Engineer hours record not found" };
    }

    const result = await db
      .delete(engineerHours)
      .where(eq(engineerHours.id, id))
      .returning();

    revalidatePath(`/server/view/${currentRecord[0].serverId}`);
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error deleting engineer hours:", typedError);
    return { success: false, error: typedError.message || "Failed to delete engineer hours" };
  }
}

export async function getEngineerHoursById(id: number) {
  try {
    const result = await db
      .select()
      .from(engineerHours)
      .where(eq(engineerHours.id, id));
    
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching engineer hours:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch engineer hours" };
  }
}

export async function getEngineerHoursByServerId(serverId: number) {
  try {
    const result = await db
      .select({
        id: engineerHours.id,
        serverId: engineerHours.serverId,
        bookingCodeId: engineerHours.bookingCodeId,
        minutes: engineerHours.minutes,
        note: engineerHours.note,
        date: engineerHours.date,
        createdAt: engineerHours.createdAt,
        updatedAt: engineerHours.updatedAt,
        bookingCode: bookingCodes.code,
        bookingCodeDescription: bookingCodes.description,
      })
      .from(engineerHours)
      .innerJoin(
        bookingCodes,
        eq(engineerHours.bookingCodeId, bookingCodes.id)
      )
      .where(eq(engineerHours.serverId, serverId))
      .orderBy(desc(engineerHours.date));

    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching engineer hours by server ID:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch engineer hours" };
  }
}

// Get available booking codes for a server
export async function getAvailableBookingCodesForServer(serverId: number) {
  try {
    console.log(`Getting booking codes for server ID: ${serverId}`);
    
    // First get the server to find its project
    const server = await db
      .select({ projectId: servers.projectId })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (server.length === 0) {
      console.log(`Server with ID ${serverId} not found`);
      return { 
        success: false, 
        error: `Server with ID ${serverId} not found` 
      };
    }
    
    if (!server[0].projectId) {
      console.log(`Server with ID ${serverId} has no project assigned`);
      return { 
        success: true, 
        data: [],
        debug: "No project assigned to this server" 
      };
    }

    const projectId = server[0].projectId;
    console.log(`Found project ID ${projectId} for server ID ${serverId}`);

    // Check if project has booking code groups
    try {
      // Using the count function as specified in the documentation
      const projectBookingCodeGroups = await db
        .select({ value: count() })
        .from(projectBookingCodes)
        .where(eq(projectBookingCodes.projectId, projectId));
        
      console.log("Count query result:", projectBookingCodeGroups);
      const hasBookingCodeGroups = projectBookingCodeGroups[0]?.value > 0;
      
      if (!hasBookingCodeGroups) {
        console.log(`Project ID ${projectId} has no booking code groups assigned`);
        return { 
          success: true, 
          data: [],
          debug: "No booking code groups assigned to this project" 
        };
      }
      
      // First get the booking code groups for this project
      const projectGroups = await db
        .select({
          groupId: projectBookingCodes.bookingCodeGroupId,
        })
        .from(projectBookingCodes)
        .where(eq(projectBookingCodes.projectId, projectId));
        
      console.log(`Found ${projectGroups.length} booking code groups for project ID ${projectId}`);
      
      if (projectGroups.length === 0) {
        return { 
          success: true, 
          data: [],
          debug: "No booking code groups assigned to this project (empty query result)" 
        };
      }
      
      // Get the group IDs
      const groupIds = projectGroups.map(group => group.groupId);
      
      // Get all booking codes for these groups with a safer approach
      // We need to handle each group ID separately
      type BookingCodeResult = {
        id: number;
        code: string;
        description: string | null;
        groupId: number;
        validFrom: Date | null;
        validTo: Date | null;
        enabled: boolean;
      };
      
      let bookingCodesResult: BookingCodeResult[] = [];
      for (const group of projectGroups) {
        const groupCodes = await db
          .select({
            id: bookingCodes.id,
            code: bookingCodes.code,
            description: bookingCodes.description,
            groupId: bookingCodes.groupId,
            validFrom: bookingCodes.validFrom,
            validTo: bookingCodes.validTo,
            enabled: bookingCodes.enabled,
          })
          .from(bookingCodes)
          .where(
            sql`${bookingCodes.groupId} = ${group.groupId} AND
                ${bookingCodes.enabled} = true AND
                ${bookingCodes.validFrom} <= CURRENT_TIMESTAMP AND
                ${bookingCodes.validTo} >= CURRENT_TIMESTAMP`
          )
          .orderBy(desc(bookingCodes.validFrom));
          
        bookingCodesResult = [...bookingCodesResult, ...groupCodes];
      }
      
      // Get group names - again, safer approach
      const groups = [];
      for (const groupId of groupIds) {
        const group = await db
          .select({
            id: bookingCodeGroups.id,
            name: bookingCodeGroups.name,
          })
          .from(bookingCodeGroups)
          .where(eq(bookingCodeGroups.id, groupId));
          
        if (group.length > 0) {
          groups.push(group[0]);
        }
      }
        
      // Create a lookup map for group names
      const groupNameMap = new Map();
      groups.forEach(group => {
        groupNameMap.set(group.id, group.name);
      });
      
      // Combine the data
      const result = bookingCodesResult.map(code => ({
        ...code,
        groupName: groupNameMap.get(code.groupId) || 'Unknown',
      }));
        
      const rows = result;
      
      console.log(`Found ${rows.length} booking codes for project ID ${projectId}`);
      
      if (rows.length === 0) {
        return { 
          success: true, 
          data: [],
          debug: "No active booking codes found for this project" 
        };
      }

      return { success: true, data: rows };
    } catch (error) {
      console.error("Query error:", error);
      return { 
        success: false, 
        error: (error as ErrorWithMessage).message || "Failed to query booking codes",
        debug: "Error in ORM query for booking codes" 
      };
    }
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching available booking codes for server:", typedError);
    return { 
      success: false, 
      error: typedError.message || "Failed to fetch available booking codes for server" 
    };
  }
}