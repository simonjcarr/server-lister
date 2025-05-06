"use server";

import db from "@/db/getdb";
import { engineerHours } from "@/db/schema/engineerHours";
import { users } from "@/db/schema/users";
import { bookingCodes } from "@/db/schema/bookingCodes";
import { servers } from "@/db/schema/servers";
import { and, eq, gte, lte, sql, sum } from "drizzle-orm";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

// Extend dayjs with ISO week plugin
// isoWeek plugin already includes isoWeekYear functionality
dayjs.extend(isoWeek);

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

// Fetch matrix data for project engineer hours
// timeGrouping: 'week', 'month', or 'year'
// includeBreakdown: whether to include a breakdown by engineer or just totals
export async function getProjectEngineerHoursMatrix(
  projectId: number,
  timeGrouping: 'week' | 'month' | 'year' = 'month',
  includeBreakdown: boolean = true,
  periodsToShow: number = 12
) {
  try {
    // Calculate the date range
    const now = dayjs();
    const endDate = now.endOf('day');
    let startDate: dayjs.Dayjs;
    let dateFormat: string;
    let intervalUnit: 'week' | 'month' | 'year';
    
    // Determine start date and format based on timeGrouping
    switch (timeGrouping) {
      case 'week':
        startDate = now.subtract(periodsToShow - 1, 'week').startOf('isoWeek');
        dateFormat = 'YYYY-[W]WW'; // Format: 2023-W01 (using ISO week)
        intervalUnit = 'week';
        break;
      case 'month':
        startDate = now.subtract(periodsToShow - 1, 'month').startOf('month');
        dateFormat = 'YYYY-MM'; // Format: 2023-01
        intervalUnit = 'month';
        break;
      case 'year':
        startDate = now.subtract(periodsToShow - 1, 'year').startOf('year');
        dateFormat = 'YYYY'; // Format: 2023
        intervalUnit = 'year';
        break;
      default:
        // Default to month
        startDate = now.subtract(periodsToShow - 1, 'month').startOf('month');
        dateFormat = 'YYYY-MM';
        intervalUnit = 'month';
    }
    
    // First, get all servers for this project
    const db_servers = await db
      .select({ id: servers.id })
      .from(servers)
      .where(eq(servers.projectId, projectId));

    if (db_servers.length === 0) {
      return {
        success: true,
        data: {
          periods: [],
          engineers: [],
          matrix: []
        }
      };
    }

    // Create an array of server IDs
    const serverIds = db_servers.map(server => server.id);
    
    // Generate the time periods for the matrix
    const periods: {
      key: string;
      label: string;
      startDate: string;
      endDate: string;
    }[] = [];
    
    let current = startDate.clone();
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      let periodKey: string;
      let periodLabel: string;
      let periodStartDate: string;
      let periodEndDate: string;
      
      if (timeGrouping === 'week') {
        // Ensure we use consistent date format everywhere
        const weekNum = current.isoWeek().toString().padStart(2, '0');
        periodKey = `${current.format('YYYY')}-W${weekNum}`;
        periodLabel = `${current.format('MMM DD')} - ${current.endOf('isoWeek').format('MMM DD')}`;
        periodStartDate = current.format('YYYY-MM-DD');
        periodEndDate = current.endOf('isoWeek').format('YYYY-MM-DD');
        current = current.add(1, 'week');
      } else if (timeGrouping === 'month') {
        periodKey = current.format(dateFormat);
        periodLabel = current.format('MMM YYYY');
        periodStartDate = current.format('YYYY-MM-DD');
        periodEndDate = current.endOf('month').format('YYYY-MM-DD');
        current = current.add(1, 'month');
      } else {
        // Year
        periodKey = current.format(dateFormat);
        periodLabel = current.format('YYYY');
        periodStartDate = current.format('YYYY-MM-DD');
        periodEndDate = current.endOf('year').format('YYYY-MM-DD');
        current = current.add(1, 'year');
      }
      
      periods.push({
        key: periodKey,
        label: periodLabel,
        startDate: periodStartDate,
        endDate: periodEndDate
      });
    }

    // We need to get the raw hours data first instead of aggregating in SQL
    // This is the key fix - we'll fetch the raw data and group it ourselves
    
    const rawHoursQuery = db
      .select({
        date: engineerHours.date,
        engineerId: engineerHours.userId,
        engineerName: users.name,
        minutes: engineerHours.minutes,
      })
      .from(engineerHours)
      .innerJoin(users, eq(engineerHours.userId, users.id))
      .where(
        and(
          sql`${engineerHours.serverId} IN (${sql.join(serverIds, sql`, `)})`,
          gte(engineerHours.date, startDate.toDate()),
          lte(engineerHours.date, endDate.toDate())
        )
      );
      
    const rawHoursData = await rawHoursQuery;
    
    // Group the data ourselves, so we have complete control
    // First, create a map of engineers
    const engineersMap = new Map<string, { id: string; name: string }>();
    rawHoursData.forEach(record => {
      if (record.engineerId && !engineersMap.has(record.engineerId)) {
        engineersMap.set(record.engineerId, {
          id: record.engineerId,
          name: record.engineerName || 'Unknown'
        });
      }
    });
    
    // Create our aggregated data map: engineerId -> period -> minutes
    const aggregatedData = new Map<string, Map<string, number>>();
    
    // Initialize all engineers with all periods set to 0
    engineersMap.forEach((engineer, engineerId) => {
      const engineerData = new Map<string, number>();
      periods.forEach(period => {
        engineerData.set(period.key, 0);
      });
      aggregatedData.set(engineerId, engineerData);
    });
    
    // Now aggregate the data ourselves, ensuring correct period assignment
    rawHoursData.forEach(record => {
      if (!record.engineerId || !record.date) return;
      
      // For each record, determine which period it belongs to
      const recordDate = dayjs(record.date);
      let periodKey: string | null = null;
      
      if (timeGrouping === 'week') {
        const weekNum = recordDate.isoWeek().toString().padStart(2, '0');
        periodKey = `${recordDate.format('YYYY')}-W${weekNum}`;
      } else if (timeGrouping === 'month') {
        periodKey = recordDate.format('YYYY-MM');
      } else {
        periodKey = recordDate.format('YYYY');
      }
      
      // Get the engineer's data map
      const engineerDataMap = aggregatedData.get(record.engineerId);
      if (engineerDataMap && periodKey && engineerDataMap.has(periodKey)) {
        // Add the minutes to the correct period
        const currentMinutes = engineerDataMap.get(periodKey) || 0;
        engineerDataMap.set(periodKey, currentMinutes + record.minutes);
      }
    });
    
    // Convert the aggregated data for our response format
    const hoursData = [];
    aggregatedData.forEach((periodMap, engineerId) => {
      periodMap.forEach((minutes, periodKey) => {
        if (minutes > 0) { // Only include non-zero entries
          const engineer = engineersMap.get(engineerId);
          hoursData.push({
            period: periodKey,
            engineerId,
            engineerName: engineer?.name || 'Unknown',
            totalMinutes: minutes
          });
        }
      });
    });
      
    // Use our newly aggregated data to build the matrix
    if (includeBreakdown) {
      // Convert our maps to arrays for the response
      const engineers = Array.from(engineersMap.values());
      
      // Define the matrix row type
      type MatrixRow = {
        engineer: { id: string; name: string };
        periodHours: { [key: string]: number };
        totalHours: number;
      };
      
      // Create the matrix using our pre-aggregated data
      const matrix: MatrixRow[] = [];
      
      // Add a row for each engineer
      engineersMap.forEach((engineer, engineerId) => {
        const periodDataMap = aggregatedData.get(engineerId);
        if (!periodDataMap) return;
        
        // Create a new row for this engineer
        const row: MatrixRow = {
          engineer: { 
            id: engineer.id,
            name: engineer.name 
          },
          periodHours: {},
          totalHours: 0
        };
        
        // Convert the period data to hours and calculate totals
        let totalHours = 0;
        
        periods.forEach(period => {
          const minutes = periodDataMap.get(period.key) || 0;
          const hours = Math.round(minutes / 60 * 10) / 10; // Round to 1 decimal
          
          row.periodHours[period.key] = hours;
          totalHours += hours;
        });
        
        row.totalHours = totalHours;
        
        // Only add rows for engineers who have logged some time
        if (totalHours > 0) {
          matrix.push(row);
        }
      });
      
      // Add a totals row
      const totalsRow: MatrixRow = {
        engineer: { id: 'total', name: 'Total' },
        periodHours: {},
        totalHours: 0
      };
      
      // Calculate period totals
      periods.forEach(period => {
        let totalForPeriod = 0;
        matrix.forEach(row => {
          totalForPeriod += row.periodHours[period.key] || 0;
        });
        
        totalsRow.periodHours[period.key] = totalForPeriod;
        totalsRow.totalHours += totalForPeriod;
      });
      
      // Add the totals row to the matrix
      matrix.push(totalsRow);
      
      return {
        success: true,
        data: {
          periods,
          engineers,
          matrix,
          totalsIncluded: true
        }
      };
    } else {
      // Simpler format for totals only - build directly from aggregated data
      const periodTotals: { [key: string]: number } = {};
      let grandTotal = 0;
      
      // Initialize all periods with zero
      periods.forEach(period => {
        periodTotals[period.key] = 0;
      });
      
      // Sum up all engineers for each period
      aggregatedData.forEach((periodMap) => {
        periodMap.forEach((minutes, periodKey) => {
          const hours = Math.round(minutes / 60 * 10) / 10; // Round to 1 decimal
          periodTotals[periodKey] = (periodTotals[periodKey] || 0) + hours;
          grandTotal += hours;
        });
      });
      
      return {
        success: true,
        data: {
          periods,
          periodTotals,
          grandTotal,
          totalsIncluded: false
        }
      };
    }
  } catch (error) {
    console.error("Error generating project engineer hours matrix:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}