"use server";

import db from "@/db/getdb";
import { engineerHours } from "@/db/schema/engineerHours";
import { servers } from "@/db/schema/servers";
import { projects } from "@/db/schema/projects";
import { bookingCodes, bookingCodeGroups } from "@/db/schema/bookingCodes";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with necessary plugins
dayjs.extend(isoWeek);    // For ISO week handling
dayjs.extend(utc);        // For UTC handling
dayjs.extend(timezone);   // For timezone handling

// Set default timezone to ensure consistent date handling
// This is critical for correct date boundaries
const DEFAULT_TIMEZONE = "UTC";

// Define error type to replace any
type ErrorWithMessage = {
  message: string;
};

/**
 * Get all booking hours for a specific user
 */
export async function getUserBookingHistory(userId: string) {
  try {
    console.log(`Getting booking history for user: ${userId}`);
    
    const result = await db
      .select({
        id: engineerHours.id,
        serverId: engineerHours.serverId,
        serverName: servers.hostname,
        projectId: servers.projectId,
        projectName: projects.name,
        bookingCodeId: engineerHours.bookingCodeId,
        bookingCode: bookingCodes.code,
        bookingCodeDescription: bookingCodes.description,
        bookingGroupId: bookingCodes.groupId,
        bookingGroupName: bookingCodeGroups.name,
        minutes: engineerHours.minutes,
        note: engineerHours.note,
        date: engineerHours.date,
        createdAt: engineerHours.createdAt,
        updatedAt: engineerHours.updatedAt,
      })
      .from(engineerHours)
      .innerJoin(bookingCodes, eq(engineerHours.bookingCodeId, bookingCodes.id))
      .innerJoin(bookingCodeGroups, eq(bookingCodes.groupId, bookingCodeGroups.id))
      .innerJoin(servers, eq(engineerHours.serverId, servers.id))
      .leftJoin(projects, eq(servers.projectId, projects.id))
      .where(eq(engineerHours.userId, userId))
      .orderBy(desc(engineerHours.date));
    
    console.log(`Found ${result.length} booking history records`);
    
    // If no data found, return an empty array instead of null/undefined
    return { success: true, data: result || [] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching user booking history:", typedError);
    return {
      success: false,
      error: typedError.message || "Failed to fetch user booking history",
      // Return an empty array even on error to avoid null/undefined issues
      data: []
    };
  }
}

/**
 * Get a weekly matrix of booking hours for the current week
 * This will return a matrix with days of the week as columns and booking codes as rows
 */
export async function getUserWeeklyBookingMatrix(userId: string, weekOffset: number = 0) {
  try {
    // Calculate the date range for the specified week
    const now = dayjs();
    const weekStart = now.startOf('isoWeek').add(weekOffset, 'week');
    const weekEnd = weekStart.endOf('isoWeek');

    // Format for display
    const weekRange = {
      start: weekStart.format('YYYY-MM-DD'),
      end: weekEnd.format('YYYY-MM-DD'),
      weekNumber: weekStart.isoWeek(),
      year: weekStart.year(),
      display: `Week ${weekStart.isoWeek()} (${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD')})`
    };

    // Check if the requested week is in the future
    const isCurrentWeek = weekOffset === 0;
    const isFutureWeek = weekOffset > 0;

    // Get days of the week for the matrix
    const daysOfWeek = getDaysOfWeek(weekStart);

    // For future weeks, just return empty data
    if (isFutureWeek) {
      return {
        success: true,
        data: {
          weekRange,
          bookingCodes: [],
          daysOfWeek,
          matrix: [],
          columnTotals: daysOfWeek.map(() => ({ minutes: 0, hours: 0, displayHours: "0.0" })),
          grandTotal: 0,
          grandTotalHours: "0.0",
          isCurrentWeek,
          isFutureWeek
        }
      };
    }

    // Get all booking hours for this user within the week
    // CRITICAL FIX: Use DATE_TRUNC to ensure consistent date handling at database level
    const bookingData = await db
      .select({
        id: engineerHours.id,
        bookingCodeId: engineerHours.bookingCodeId,
        bookingCode: bookingCodes.code,
        bookingCodeDescription: bookingCodes.description, 
        bookingGroupId: bookingCodes.groupId,
        bookingGroupName: bookingCodeGroups.name,
        minutes: engineerHours.minutes,
        // FIXED: Use DATE_TRUNC to ensure proper date handling without timezone issues
        date: sql`DATE_TRUNC('day', ${engineerHours.date})::date`,
        // Include raw date for debugging
        rawDate: engineerHours.date,
      })
      .from(engineerHours)
      .innerJoin(bookingCodes, eq(engineerHours.bookingCodeId, bookingCodes.id))
      .innerJoin(bookingCodeGroups, eq(bookingCodes.groupId, bookingCodeGroups.id))
      .where(
        and(
          eq(engineerHours.userId, userId),
          gte(engineerHours.date, weekStart.toDate()),
          lte(engineerHours.date, weekEnd.toDate())
        )
      );
      
    console.log(`Weekly matrix query - weekStart: ${weekStart.format('YYYY-MM-DD')}, weekEnd: ${weekEnd.format('YYYY-MM-DD')}`);
    console.log(`Found ${bookingData.length} booking entries for the week`);
    if (bookingData.length > 0) {
      console.log(`Sample entry date: ${dayjs(bookingData[0].date).format('YYYY-MM-DD')}`);
    }

    // If no data found for the week
    if (bookingData.length === 0) {
      return {
        success: true,
        data: {
          weekRange,
          bookingCodes: [],
          daysOfWeek,
          matrix: [],
          columnTotals: daysOfWeek.map(() => ({ minutes: 0, hours: 0, displayHours: "0.0" })),
          grandTotal: 0,
          grandTotalHours: "0.0",
          isCurrentWeek,
          isFutureWeek
        }
      };
    }

    // Extract unique booking codes
    const bookingCodesMap = new Map();
    bookingData.forEach(record => {
      if (!bookingCodesMap.has(record.bookingCodeId)) {
        bookingCodesMap.set(record.bookingCodeId, {
          id: record.bookingCodeId,
          code: record.bookingCode,
          description: record.bookingCodeDescription,
          groupId: record.bookingGroupId,
          groupName: record.bookingGroupName
        });
      }
    });
    const uniqueBookingCodes = Array.from(bookingCodesMap.values());

    // Days of week was already generated above

    // Create the matrix data
    const matrix = uniqueBookingCodes.map(bookingCode => {
      const dailyMinutes = daysOfWeek.map(day => {
        // Find all entries for this booking code on this day
        const dayEntries = bookingData.filter(record => {
          // Now we're getting a clean date from the database thanks to DATE_TRUNC('day')::date
          // This means we can directly compare the dates without worrying about timezone shifts
          
          // Format both dates consistently for comparison
          let recordDateStr;
          
          if (record.date instanceof Date) {
            // If it's a Date object, format it
            recordDateStr = dayjs.utc(record.date).format('YYYY-MM-DD');
          } else if (typeof record.date === 'string') {
            // If it's a string, use it directly or extract date part
            recordDateStr = record.date.includes('T') 
              ? record.date.split('T')[0] 
              : record.date;
          } else {
            // Fallback for any other format
            recordDateStr = String(record.date);
          }
          
          const isDayMatch = recordDateStr === day.date;
          const isMatch = record.bookingCodeId === bookingCode.id && isDayMatch;
          
          // Add debug logging for April 13 data to track the issue
          if ((day.date === '2025-04-13' || (record.rawDate && String(record.rawDate).includes('2025-04-13'))) && 
              record.bookingCodeId === bookingCode.id) {
            console.log(`[FIXED] April 13 record check:`, {
              bookingCode: bookingCode.code, 
              dayDate: day.date, 
              recordDate: recordDateStr, 
              rawDate: record.rawDate, 
              isMatch
            });
          }
          
          return isMatch;
        });

        // Sum up the minutes
        const totalMinutes = dayEntries.reduce((sum, record) => sum + record.minutes, 0);
        
        return {
          minutes: totalMinutes,
          hours: totalMinutes / 60, // Convert to hours
          displayHours: (totalMinutes / 60).toFixed(1) // Format for display
        };
      });

      // Calculate row totals
      const totalMinutes = dailyMinutes.reduce((sum, day) => sum + day.minutes, 0);

      return {
        bookingCode,
        dailyMinutes,
        totalMinutes,
        totalHours: totalMinutes / 60,
        displayTotalHours: (totalMinutes / 60).toFixed(1)
      };
    });

    // Calculate column totals
    const columnTotals = daysOfWeek.map((day, index) => {
      const totalMinutes = matrix.reduce((sum, row) => sum + row.dailyMinutes[index].minutes, 0);
      return {
        minutes: totalMinutes,
        hours: totalMinutes / 60,
        displayHours: (totalMinutes / 60).toFixed(1)
      };
    });

    // Calculate grand total
    const grandTotal = columnTotals.reduce((sum, day) => sum + day.minutes, 0);

    return {
      success: true,
      data: {
        weekRange,
        bookingCodes: uniqueBookingCodes,
        daysOfWeek,
        matrix,
        columnTotals,
        grandTotal,
        grandTotalHours: (grandTotal / 60).toFixed(1),
        isCurrentWeek,
        isFutureWeek
      }
    };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error generating weekly booking matrix:", typedError);
    
    // Even in case of error, return a properly structured response
    const daysOfWeek = getDaysOfWeek(dayjs().startOf('isoWeek').add(weekOffset, 'week'));
    
    return {
      success: false,
      error: typedError.message || "Failed to generate weekly booking matrix",
      data: {
        weekRange: {
          start: '',
          end: '',
          weekNumber: 0,
          year: 0,
          display: 'Error loading week data'
        },
        bookingCodes: [],
        daysOfWeek,
        matrix: [],
        columnTotals: daysOfWeek.map(() => ({ minutes: 0, hours: 0, displayHours: "0.0" })),
        grandTotal: 0,
        grandTotalHours: "0.0",
        isCurrentWeek: weekOffset === 0,
        isFutureWeek: weekOffset > 0
      }
    };
  }
}

/**
 * Helper function to generate days of the week from a start date
 */
function getDaysOfWeek(weekStart: dayjs.Dayjs) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = weekStart.add(i, 'day');
    days.push({
      date: day.format('YYYY-MM-DD'),
      dayName: day.format('ddd'),
      displayDate: day.format('DD MMM')
    });
  }
  return days;
}