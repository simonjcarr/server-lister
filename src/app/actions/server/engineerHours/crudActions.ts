"use server";

import db from "@/db/getdb";
import {
  engineerHours,
  insertEngineerHoursSchema,
  updateEngineerHoursSchema,
} from "@/db/schema/engineerHours";
import { servers } from "@/db/schema/servers";
import { bookingCodes, projectBookingCodes, bookingCodeGroups } from "@/db/schema/bookingCodes";
import { desc, eq, count, sql, and, gte, lte, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { users } from "@/db/schema/users";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

// Extend dayjs with isoWeek plugin
dayjs.extend(isoWeek);

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
  userId: string;
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

export async function getEngineerHoursByServerId(serverId: number, currentUserId?: string) {
  try {
    // We'll use different queries based on whether we need to filter by user
    let result;
    
    // Base query
    const baseQuery = {
      id: engineerHours.id,
      serverId: engineerHours.serverId,
      bookingCodeId: engineerHours.bookingCodeId,
      userId: engineerHours.userId,
      minutes: engineerHours.minutes,
      note: engineerHours.note,
      date: engineerHours.date,
      createdAt: engineerHours.createdAt,
      updatedAt: engineerHours.updatedAt,
      bookingCode: bookingCodes.code,
      bookingCodeDescription: bookingCodes.description,
      userName: users.name,
      userEmail: users.email,
    };
    
    // If filtering by user
    if (currentUserId) {
      result = await db
        .select(baseQuery)
        .from(engineerHours)
        .innerJoin(
          bookingCodes,
          eq(engineerHours.bookingCodeId, bookingCodes.id)
        )
        .innerJoin(
          users,
          eq(engineerHours.userId, users.id)
        )
        .where(
          sql`${engineerHours.serverId} = ${serverId} AND ${engineerHours.userId} = ${currentUserId}`
        )
        .orderBy(desc(engineerHours.date));
    } else {
      // No user filter
      result = await db
        .select(baseQuery)
        .from(engineerHours)
        .innerJoin(
          bookingCodes,
          eq(engineerHours.bookingCodeId, bookingCodes.id)
        )
        .innerJoin(
          users,
          eq(engineerHours.userId, users.id)
        )
        .where(eq(engineerHours.serverId, serverId))
        .orderBy(desc(engineerHours.date));
    }

    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching engineer hours by server ID:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch engineer hours" };
  }
}

// Get available booking codes for a server
// Get weekly engineer hours matrix
export async function getWeeklyEngineerHoursMatrix(serverId: number, weeksToShow: number = 4) {
  try {
    // Calculate the date range - ensure we get full weeks
    const now = dayjs();
    const endDate = now.endOf('day');
    // Get start of current week, then go back (weeksToShow-1) weeks
    const currentWeekStart = now.startOf('isoWeek');
    const startDate = currentWeekStart.clone().subtract(weeksToShow - 1, 'week');
    
    // Get all engineer hours within this date range
    const hoursData = await db
      .select({
        id: engineerHours.id,
        userId: engineerHours.userId,
        userName: users.name,
        minutes: engineerHours.minutes,
        date: engineerHours.date,
      })
      .from(engineerHours)
      .innerJoin(
        users,
        eq(engineerHours.userId, users.id)
      )
      .where(
        and(
          eq(engineerHours.serverId, serverId),
          gte(engineerHours.date, startDate.toDate()),
          lte(engineerHours.date, endDate.toDate())
        )
      );
    
    if (hoursData.length === 0) {
      return { 
        success: true, 
        data: {
          weeks: [],
          engineers: [],
          matrix: []
        } 
      };
    }

    // Generate the list of week ranges
    const weeks: {
      start: string;
      end: string;
      weekNumber: number;
      year: number;
      label: string;
    }[] = [];
    
    // Generate weeks using the current week as reference
    for (let i = 0; i < weeksToShow; i++) {
      // Calculate week by starting with current week and going back i weeks
      const weekStart = now.clone().startOf('isoWeek').subtract(i, 'week');
      const weekEnd = weekStart.clone().endOf('isoWeek');
      
      
      weeks.push({
        start: weekStart.format('YYYY-MM-DD'),
        end: weekEnd.format('YYYY-MM-DD'),
        weekNumber: weekStart.isoWeek(),
        year: weekStart.year(),
        label: `W${weekStart.isoWeek()} (${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD')})`
      });
    }
    // Reverse to show oldest week first
    weeks.reverse();

    // Extract unique engineers
    const engineersMap = new Map();
    hoursData.forEach(record => {
      if (!engineersMap.has(record.userId)) {
        engineersMap.set(record.userId, {
          id: record.userId,
          name: record.userName || 'Unknown'
        });
      }
    });
    const engineers = Array.from(engineersMap.values());

    // Create the matrix data
    const matrix = engineers.map(engineer => {
      const weeklyHours = weeks.map(week => {
        // Find all entries for this engineer in this week
        const weekStart = dayjs(week.start);
        const weekEnd = dayjs(week.end);
        
        const weekEntries = hoursData.filter(record => {
          const recordDate = dayjs(record.date);
          // Check if the record date is within the week
          // We need to ignore time part for proper comparison
          const normalizedRecordDate = recordDate.format('YYYY-MM-DD');
          const normalizedWeekStart = weekStart.format('YYYY-MM-DD');
          const normalizedWeekEnd = weekEnd.format('YYYY-MM-DD');
          
          return (
            record.userId === engineer.id &&
            normalizedRecordDate >= normalizedWeekStart && 
            normalizedRecordDate <= normalizedWeekEnd
          );
        });

        // Sum up the minutes
        const totalMinutes = weekEntries.reduce((sum, record) => sum + record.minutes, 0);
        
        return {
          minutes: totalMinutes,
          hours: Math.round(totalMinutes / 60 * 10) / 10, // Round to 1 decimal place
        };
      });

      return {
        engineer,
        weeklyHours
      };
    });

    return {
      success: true,
      data: {
        weeks,
        engineers,
        matrix
      }
    };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error generating weekly engineer hours matrix:", typedError);
    return {
      success: false,
      error: typedError.message || "Failed to generate weekly engineer hours matrix"
    };
  }
}

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

// Get engineer hours data for all servers in a project
export async function getProjectEngineerHoursSummary(
  projectId: number,
  timeRange: 'week' | 'month' | '6months' | 'year' | 'all',
  chartType: 'individual' | 'cumulative'
) {
  try {
    // Calculate the start date based on the time range
    const now = dayjs();
    const endDate = now.endOf("day").toDate();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = now.subtract(1, "week").startOf("day").toDate();
        break;
      case "month":
        startDate = now.subtract(1, "month").startOf("day").toDate();
        break;
      case "6months":
        startDate = now.subtract(6, "months").startOf("day").toDate();
        break;
      case "year":
        startDate = now.subtract(1, "year").startOf("day").toDate();
        break;
      case "all":
      default:
        // For "all", we'll use a very old date as the start
        startDate = new Date(2000, 0, 1);
    }

    // Determine grouping precision based on time range
    // For shorter ranges, we'll group by day, for longer ranges by week or month
    let intervalType: "day" | "week" | "month";

    if (timeRange === "week") {
      intervalType = "day";
    } else if (timeRange === "month") {
      intervalType = "day";
    } else if (timeRange === "6months") {
      intervalType = "week";
    } else {
      intervalType = "month";
    }

    // First, get all servers for this project
    const projectServers = await db
      .select({ id: servers.id })
      .from(servers)
      .where(eq(servers.projectId, projectId));

    if (projectServers.length === 0) {
      return {
        success: true,
        data: [],
        timeRangeBoundaries: {
          startDate,
          endDate,
          intervalType,
          timeRange,
        }
      };
    }

    // Create an array of server IDs
    const serverIds = projectServers.map(server => server.id);

    // SQL conditional for date formatting based on interval type
    let dateExpr;
    if (intervalType === "day") {
      dateExpr = sql`TO_CHAR(${engineerHours.date}, 'YYYY-MM-DD')`;
    } else if (intervalType === "week") {
      dateExpr = sql`TO_CHAR(DATE_TRUNC('week', ${engineerHours.date}), 'YYYY-MM-DD')`;
    } else {
      dateExpr = sql`TO_CHAR(${engineerHours.date}, 'YYYY-MM')`;
    }

    // Fetch data based on chart type
    if (chartType === 'individual') {
      // For individual engineers data
      const result = await db
        .select({
          date: dateExpr,
          engineerId: engineerHours.userId,
          engineerName: users.name,
          totalMinutes: sum(engineerHours.minutes),
        })
        .from(engineerHours)
        .innerJoin(users, eq(engineerHours.userId, users.id))
        .innerJoin(bookingCodes, eq(engineerHours.bookingCodeId, bookingCodes.id))
        .where(
          and(
            sql`${engineerHours.serverId} IN (${sql.join(serverIds, sql`, `)})`,
            gte(engineerHours.date, startDate),
            lte(engineerHours.date, endDate)
          )
        )
        .groupBy(dateExpr, engineerHours.userId, users.name)
        .orderBy(dateExpr);

      // Transform the results into chart-ready data
      const transformedData = result.map(item => ({
        date: item.date ? String(item.date) : "",
        engineerId: item.engineerId,
        engineerName: item.engineerName || "Unknown",
        totalMinutes: Number(item.totalMinutes) || 0,
        totalHours: Math.round((Number(item.totalMinutes) || 0) / 60 * 10) / 10, // Round to 1 decimal
      }));

      return {
        success: true,
        data: transformedData,
        timeRange,
        intervalType,
        timeRangeBoundaries: {
          startDate,
          endDate,
          intervalType,
          timeRange,
        }
      };
    } else {
      // For cumulative data
      const result = await db
        .select({
          date: dateExpr,
          totalMinutes: sum(engineerHours.minutes),
        })
        .from(engineerHours)
        .where(
          and(
            sql`${engineerHours.serverId} IN (${sql.join(serverIds, sql`, `)})`,
            gte(engineerHours.date, startDate),
            lte(engineerHours.date, endDate)
          )
        )
        .groupBy(dateExpr)
        .orderBy(dateExpr);

      // Transform the results into chart-ready data
      const transformedData = result.map(item => ({
        date: item.date ? String(item.date) : "",
        totalMinutes: Number(item.totalMinutes) || 0,
        totalHours: Math.round((Number(item.totalMinutes) || 0) / 60 * 10) / 10, // Round to 1 decimal
      }));

      return {
        success: true,
        data: transformedData,
        timeRange,
        intervalType,
        timeRangeBoundaries: {
          startDate,
          endDate,
          intervalType,
          timeRange,
        }
      };
    }
  } catch (error) {
    console.error("Error fetching project engineer hours summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Get engineer hours data for all servers with booking codes from a specific group
export async function getBookingCodeGroupEngineerHoursSummary(
  groupId: number,
  timeRange: 'week' | 'month' | '6months' | 'year' | 'all',
  chartType: 'individual' | 'cumulative'
) {
  try {
    // Calculate the start date based on the time range
    const now = dayjs();
    const endDate = now.endOf("day").toDate();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = now.subtract(1, "week").startOf("day").toDate();
        break;
      case "month":
        startDate = now.subtract(1, "month").startOf("day").toDate();
        break;
      case "6months":
        startDate = now.subtract(6, "months").startOf("day").toDate();
        break;
      case "year":
        startDate = now.subtract(1, "year").startOf("day").toDate();
        break;
      case "all":
      default:
        // For "all", we'll use a very old date as the start
        startDate = new Date(2000, 0, 1);
    }

    // Determine grouping precision based on time range
    let intervalType: "day" | "week" | "month";

    if (timeRange === "week") {
      intervalType = "day";
    } else if (timeRange === "month") {
      intervalType = "day";
    } else if (timeRange === "6months") {
      intervalType = "week";
    } else {
      intervalType = "month";
    }

    // SQL conditional for date formatting based on interval type
    let dateExpr;
    if (intervalType === "day") {
      dateExpr = sql`TO_CHAR(${engineerHours.date}, 'YYYY-MM-DD')`;
    } else if (intervalType === "week") {
      dateExpr = sql`TO_CHAR(DATE_TRUNC('week', ${engineerHours.date}), 'YYYY-MM-DD')`;
    } else {
      dateExpr = sql`TO_CHAR(${engineerHours.date}, 'YYYY-MM')`;
    }

    // Fetch all booking codes in this group (including inactive ones)
    const allBookingCodes = await db
      .select({ id: bookingCodes.id })
      .from(bookingCodes)
      .where(eq(bookingCodes.groupId, groupId));

    if (allBookingCodes.length === 0) {
      return {
        success: true,
        data: [],
        timeRangeBoundaries: {
          startDate,
          endDate,
          intervalType,
          timeRange,
        }
      };
    }

    // Create an array of booking code IDs
    const bookingCodeIds = allBookingCodes.map(code => code.id);

    // Fetch data based on chart type
    if (chartType === 'individual') {
      // For individual engineers data
      const result = await db
        .select({
          date: dateExpr,
          engineerId: engineerHours.userId,
          engineerName: users.name,
          totalMinutes: sum(engineerHours.minutes),
        })
        .from(engineerHours)
        .innerJoin(users, eq(engineerHours.userId, users.id))
        .where(
          and(
            sql`${engineerHours.bookingCodeId} IN (${sql.join(bookingCodeIds, sql`, `)})`,
            gte(engineerHours.date, startDate),
            lte(engineerHours.date, endDate)
          )
        )
        .groupBy(dateExpr, engineerHours.userId, users.name)
        .orderBy(dateExpr);

      // Transform the results into chart-ready data
      const transformedData = result.map(item => ({
        date: item.date ? String(item.date) : "",
        engineerId: item.engineerId,
        engineerName: item.engineerName || "Unknown",
        totalMinutes: Number(item.totalMinutes) || 0,
        totalHours: Math.round((Number(item.totalMinutes) || 0) / 60 * 10) / 10, // Round to 1 decimal
      }));

      return {
        success: true,
        data: transformedData,
        timeRange,
        intervalType,
        timeRangeBoundaries: {
          startDate,
          endDate,
          intervalType,
          timeRange,
        }
      };
    } else {
      // For cumulative data
      const result = await db
        .select({
          date: dateExpr,
          totalMinutes: sum(engineerHours.minutes),
        })
        .from(engineerHours)
        .where(
          and(
            sql`${engineerHours.bookingCodeId} IN (${sql.join(bookingCodeIds, sql`, `)})`,
            gte(engineerHours.date, startDate),
            lte(engineerHours.date, endDate)
          )
        )
        .groupBy(dateExpr)
        .orderBy(dateExpr);

      // Transform the results into chart-ready data
      const transformedData = result.map(item => ({
        date: item.date ? String(item.date) : "",
        totalMinutes: Number(item.totalMinutes) || 0,
        totalHours: Math.round((Number(item.totalMinutes) || 0) / 60 * 10) / 10, // Round to 1 decimal
      }));

      return {
        success: true,
        data: transformedData,
        timeRange,
        intervalType,
        timeRangeBoundaries: {
          startDate,
          endDate,
          intervalType,
          timeRange,
        }
      };
    }
  } catch (error) {
    console.error("Error fetching booking code group engineer hours summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}