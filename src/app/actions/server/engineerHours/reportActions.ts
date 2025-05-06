"use server";

import db from "@/db/getdb";
import { engineerHours } from "@/db/schema/engineerHours";
import { users } from "@/db/schema/users";
import { bookingCodes } from "@/db/schema/bookingCodes";
import { and, eq, gte, lte, sql, sum } from "drizzle-orm";
import dayjs from "dayjs";

type TimeRange = "week" | "month" | "6months" | "year" | "all";

interface EngineerHoursChartParams {
  serverId: number;
  timeRange: TimeRange;
  currentUserOnly?: boolean;
  userId?: string;
}

interface DataPoint {
  date: string;
  engineerId: string;
  engineerName: string;
  totalMinutes: number;
  totalHours: number;
}

export async function getEngineerHoursChartData({
  serverId,
  timeRange,
  currentUserOnly = false,
  userId,
}: EngineerHoursChartParams) {
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

    // Basic filter conditions
    const baseConditions = [
      eq(engineerHours.serverId, serverId),
      gte(engineerHours.date, startDate),
      lte(engineerHours.date, endDate),
    ];

    // Add current user filter if requested
    if (currentUserOnly && userId) {
      baseConditions.push(eq(engineerHours.userId, userId));
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

    // Fetch the grouped data
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
      .where(and(...baseConditions))
      .groupBy(dateExpr, engineerHours.userId, users.name)
      .orderBy(dateExpr);

    // Transform the results into chart-ready data
    const transformedData: DataPoint[] = result.map(item => ({
      date: item.date ? String(item.date) : "", // Ensure date is a string
      engineerId: item.engineerId,
      engineerName: item.engineerName || "Unknown",
      totalMinutes: Number(item.totalMinutes) || 0,
      totalHours: Math.round((Number(item.totalMinutes) || 0) / 60 * 10) / 10, // Round to 1 decimal
    }));

    // Calculate expected time periods based on requested time range
    const timeRangeBoundaries = {
      startDate,
      endDate,
      intervalType,
      timeRange,
    };

    return {
      success: true,
      data: transformedData,
      timeRange,
      intervalType,
      timeRangeBoundaries,
    };
  } catch (error) {
    console.error("Error fetching engineer hours chart data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Helper function to get data for all engineers combined (cumulative)
export async function getCumulativeEngineerHoursChartData({
  serverId,
  timeRange,
}: {
  serverId: number;
  timeRange: TimeRange;
}) {
  try {
    // Get detailed data from the main function
    const detailedResult = await getEngineerHoursChartData({
      serverId,
      timeRange,
    });

    if (!detailedResult.success) {
      return detailedResult;
    }

    // Group by date to get cumulative data
    const cumulativeByDate = new Map<string, { date: string; totalMinutes: number; totalHours: number }>();

    if (detailedResult.data) {
      detailedResult.data.forEach(item => {
        const { date, totalMinutes } = item;
        
        if (!cumulativeByDate.has(date)) {
          cumulativeByDate.set(date, {
            date,
            totalMinutes: 0,
            totalHours: 0,
          });
        }
        
        const existing = cumulativeByDate.get(date)!;
        existing.totalMinutes += totalMinutes;
        existing.totalHours = Math.round(existing.totalMinutes / 60 * 10) / 10; // Round to 1 decimal
      });
    }

    return {
      success: true,
      data: Array.from(cumulativeByDate.values()),
      timeRange,
      intervalType: detailedResult.intervalType,
      timeRangeBoundaries: detailedResult.timeRangeBoundaries
    };
  } catch (error) {
    console.error("Error fetching cumulative engineer hours chart data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}