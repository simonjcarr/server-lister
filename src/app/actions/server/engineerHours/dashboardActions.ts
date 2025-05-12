"use server";

import db from "@/db/getdb";
import { engineerHours } from "@/db/schema/engineerHours";
import { users } from "@/db/schema/users";
import { servers } from "@/db/schema/servers";
import { projects } from "@/db/schema/projects";
import { and, eq, gte, lte, sql, sum } from "drizzle-orm";
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

type TimeRange = "week" | "month" | "6months" | "year" | "all";
type ChartType = "individual" | "cumulative";

/**
 * Get all engineer hours data for the dashboard chart, grouped by project
 */
export async function getDashboardEngineerHoursChartData({
  timeRange,
  chartType,
}: {
  timeRange: TimeRange;
  chartType: ChartType;
}) {
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

    if (chartType === "individual") {
      // For individual chart, we want data grouped by project and engineer
      // CRITICAL FIX: Modify SQL to handle dates correctly at the database level
      const result = await db
        .select({
          // Fix: Instead of using dateExpr which might introduce timezone issues,
          // use DATE_TRUNC to get a consistent date at database level
          date: sql`DATE_TRUNC('day', ${engineerHours.date})::date`,
          projectId: projects.id,
          projectName: projects.name,
          engineerId: engineerHours.userId,
          engineerName: users.name,
          totalMinutes: sum(engineerHours.minutes),
          // Debug field to see the original date
          rawDate: sql`${engineerHours.date}`,
        })
        .from(engineerHours)
        .innerJoin(servers, eq(engineerHours.serverId, servers.id))
        .innerJoin(projects, eq(servers.projectId, projects.id))
        .innerJoin(users, eq(engineerHours.userId, users.id))
        .where(
          and(
            gte(engineerHours.date, startDate),
            lte(engineerHours.date, endDate)
          )
        )
        .groupBy(
          sql`DATE_TRUNC('day', ${engineerHours.date})::date`,
          projects.id,
          projects.name,
          engineerHours.userId,
          users.name,
          engineerHours.date  // Include the raw date in the GROUP BY for our debug field
        )
        .orderBy(dateExpr);

      // Transform the results into chart-ready data
      const transformedData = result.map(item => ({
        date: item.date ? String(item.date) : "",
        projectId: item.projectId,
        projectName: item.projectName || "Unknown Project",
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
        },
      };
    } else {
      // For cumulative chart, we want data grouped by project only
      // CRITICAL FIX: Apply the same date-handling fix to the cumulative query
      const result = await db
        .select({
          // Fix: Use DATE_TRUNC for consistent date handling at database level
          date: sql`DATE_TRUNC('day', ${engineerHours.date})::date`,
          projectId: projects.id,
          projectName: projects.name,
          totalMinutes: sum(engineerHours.minutes),
          // Add raw date for debugging
          rawDate: sql`${engineerHours.date}`,
        })
        .from(engineerHours)
        .innerJoin(servers, eq(engineerHours.serverId, servers.id))
        .innerJoin(projects, eq(servers.projectId, projects.id))
        .where(
          and(
            gte(engineerHours.date, startDate),
            lte(engineerHours.date, endDate)
          )
        )
        .groupBy(
          sql`DATE_TRUNC('day', ${engineerHours.date})::date`, 
          projects.id, 
          projects.name,
          engineerHours.date // For our debug field
        )
        .orderBy(dateExpr);

      // Transform the results into chart-ready data
      const transformedData = result.map(item => ({
        date: item.date ? String(item.date) : "",
        projectId: item.projectId,
        projectName: item.projectName || "Unknown Project",
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
        },
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard engineer hours chart data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Get engineer hours matrix data for the dashboard, grouped by project
 */
export async function getDashboardEngineerHoursMatrix(
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
    
    // Determine start date and format based on timeGrouping
    switch (timeGrouping) {
      case 'week':
        startDate = now.subtract(periodsToShow - 1, 'week').startOf('isoWeek');
        dateFormat = 'YYYY-[W]WW'; // Format: 2023-W01 (using ISO week)
        break;
      case 'month':
        startDate = now.subtract(periodsToShow - 1, 'month').startOf('month');
        dateFormat = 'YYYY-MM'; // Format: 2023-01
        break;
      case 'year':
        startDate = now.subtract(periodsToShow - 1, 'year').startOf('year');
        dateFormat = 'YYYY'; // Format: 2023
        break;
      default:
        // Default to month
        startDate = now.subtract(periodsToShow - 1, 'month').startOf('month');
        dateFormat = 'YYYY-MM';
    }
    
    // Generate the time periods for the matrix
    const periods: {
      key: string;
      label: string;
      startDate: string;
      endDate: string;
    }[] = [];
    
    console.log(`[DEBUG Dashboard] Generating periods, startDate: ${startDate.format('YYYY-MM-DD')}, endDate: ${endDate.format('YYYY-MM-DD')}`);
    
    let current = startDate.clone();
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      let periodKey: string;
      let periodLabel: string;
      let periodStartDate: string;
      let periodEndDate: string;
      
      if (timeGrouping === 'week') {
        // Always ensure current is at the start of ISO week to avoid misalignments
        const weekStart = current.startOf('isoWeek');
        const weekEnd = weekStart.clone().endOf('isoWeek');
        const weekNum = weekStart.isoWeek().toString().padStart(2, '0');
        
        periodKey = `${weekStart.format('YYYY')}-W${weekNum}`;
        periodLabel = `${weekStart.format('MMM DD')} - ${weekEnd.format('MMM DD')}`;
        periodStartDate = weekStart.format('YYYY-MM-DD');
        periodEndDate = weekEnd.format('YYYY-MM-DD');
        
        // Log the period that would contain April 13
        if (weekStart.isBefore('2025-04-13') && weekEnd.isAfter('2025-04-13')) {
          console.log(`[DEBUG Dashboard] Found period that should contain April 13: ${periodKey}, startDate: ${periodStartDate}, endDate: ${periodEndDate}`);
        }
        
        // Move to next week
        current = weekEnd.add(1, 'day');
      } else if (timeGrouping === 'month') {
        const monthStart = current.startOf('month');
        const monthEnd = monthStart.clone().endOf('month');
        
        periodKey = monthStart.format(dateFormat);
        periodLabel = monthStart.format('MMM YYYY');
        periodStartDate = monthStart.format('YYYY-MM-DD');
        periodEndDate = monthEnd.format('YYYY-MM-DD');
        
        // Move to next month
        current = monthEnd.add(1, 'day');
      } else {
        // Year
        const yearStart = current.startOf('year');
        const yearEnd = yearStart.clone().endOf('year');
        
        periodKey = yearStart.format(dateFormat);
        periodLabel = yearStart.format('YYYY');
        periodStartDate = yearStart.format('YYYY-MM-DD');
        periodEndDate = yearEnd.format('YYYY-MM-DD');
        
        // Move to next year
        current = yearEnd.add(1, 'day');
      }
      
      periods.push({
        key: periodKey,
        label: periodLabel,
        startDate: periodStartDate,
        endDate: periodEndDate
      });
    }

    // Get raw hours data for all projects
    const rawHoursQuery = db
      .select({
        date: engineerHours.date,
        projectId: projects.id,
        projectName: projects.name,
        engineerId: engineerHours.userId,
        engineerName: users.name,
        minutes: engineerHours.minutes,
      })
      .from(engineerHours)
      .innerJoin(servers, eq(engineerHours.serverId, servers.id))
      .innerJoin(projects, eq(servers.projectId, projects.id))
      .innerJoin(users, eq(engineerHours.userId, users.id))
      .where(
        and(
          gte(engineerHours.date, startDate.toDate()),
          lte(engineerHours.date, endDate.toDate())
        )
      );
      
    const rawHoursData = await rawHoursQuery;
    
    // If we have no data, return an empty result
    if (rawHoursData.length === 0) {
      return {
        success: true,
        data: {
          periods,
          projects: [],
          matrix: []
        }
      };
    }
    
    // Create project and engineer maps for aggregation
    const projectsMap = new Map<number, { id: number; name: string }>();
    const engineersMap = new Map<string, { id: string; name: string }>();
    
    // Fill in the maps from raw data
    rawHoursData.forEach(record => {
      if (record.projectId && !projectsMap.has(record.projectId)) {
        projectsMap.set(record.projectId, {
          id: record.projectId,
          name: record.projectName || 'Unknown Project'
        });
      }
      
      if (record.engineerId && !engineersMap.has(record.engineerId)) {
        engineersMap.set(record.engineerId, {
          id: record.engineerId,
          name: record.engineerName || 'Unknown'
        });
      }
    });
    
    // Function to determine period key based on record date
    const getPeriodKey = (date: Date) => {
      // CRITICAL FIX: Use UTC for consistent date handling
      const rawDate = new Date(date);
      const recordDate = dayjs.utc(rawDate);
      
      // Debug logging for April 13
      if (recordDate.format('YYYY-MM-DD') === '2025-04-13') {
        console.log(`[DEBUG] Dashboard - Processing April 13 record:`, {
          rawDate: rawDate.toISOString(),
          utcDate: recordDate.format('YYYY-MM-DD'),
          localDate: dayjs(date).format('YYYY-MM-DD')
        });
      }
      
      if (timeGrouping === 'week') {
        // Ensure consistent ISO week handling across all components
        const weekNum = recordDate.isoWeek().toString().padStart(2, '0');
        const periodKey = `${recordDate.format('YYYY')}-W${weekNum}`;
        
        // Debug logging for April 13
        if (recordDate.format('YYYY-MM-DD') === '2025-04-13') {
          console.log(`[DEBUG] Dashboard - April 13 week assignment:`, {
            date: recordDate.format('YYYY-MM-DD'),
            isoWeek: recordDate.isoWeek(),
            periodKey,
            startOfWeek: recordDate.startOf('isoWeek').format('YYYY-MM-DD'),
            endOfWeek: recordDate.endOf('isoWeek').format('YYYY-MM-DD')
          });
        }
        
        return periodKey;
      } else if (timeGrouping === 'month') {
        return recordDate.format('YYYY-MM');
      } else {
        return recordDate.format('YYYY');
      }
    };
    
    // Build aggregation maps
    const projectHoursMap = new Map<number, Map<string, number>>();
    const projectEngineerHoursMap = new Map<number, Map<string, Map<string, number>>>();
    
    // Initialize all projects with all periods set to 0
    projectsMap.forEach((project, projectId) => {
      // Initialize project totals
      const projectPeriods = new Map<string, number>();
      periods.forEach(period => {
        projectPeriods.set(period.key, 0);
      });
      projectHoursMap.set(projectId, projectPeriods);
      
      if (includeBreakdown) {
        // Initialize per-engineer breakdowns for each project
        const projectEngineers = new Map<string, Map<string, number>>();
        engineersMap.forEach((engineer, engineerId) => {
          const engineerPeriods = new Map<string, number>();
          periods.forEach(period => {
            engineerPeriods.set(period.key, 0);
          });
          projectEngineers.set(engineerId, engineerPeriods);
        });
        projectEngineerHoursMap.set(projectId, projectEngineers);
      }
    });
    
    // Aggregate the data
    rawHoursData.forEach(record => {
      if (!record.date || !record.projectId) return;
      
      const periodKey = getPeriodKey(record.date);
      
      // Update project totals
      const projectPeriods = projectHoursMap.get(record.projectId);
      if (projectPeriods && projectPeriods.has(periodKey)) {
        const currentMinutes = projectPeriods.get(periodKey) || 0;
        const newTotal = currentMinutes + record.minutes;
        projectPeriods.set(periodKey, newTotal);
        
        // Debug log for April 13 data
        if (recordDate.format('YYYY-MM-DD') === '2025-04-13') {
          console.log(`[DEBUG Dashboard] Updated April 13 record:`, {
            date: recordDate.format('YYYY-MM-DD'),
            projectId: record.projectId,
            projectName: record.projectName,
            periodKey,
            oldTotal: currentMinutes,
            adding: record.minutes,
            newTotal
          });
        }
      }
      
      // Update engineer breakdowns if needed
      if (includeBreakdown && record.engineerId) {
        const projectEngineers = projectEngineerHoursMap.get(record.projectId);
        if (projectEngineers) {
          const engineerPeriods = projectEngineers.get(record.engineerId);
          if (engineerPeriods && engineerPeriods.has(periodKey)) {
            const currentMinutes = engineerPeriods.get(periodKey) || 0;
            const newTotal = currentMinutes + record.minutes;
            engineerPeriods.set(periodKey, newTotal);
            
            // Add debug log for April 13
            if (recordDate.format('YYYY-MM-DD') === '2025-04-13') {
              console.log(`[DEBUG Dashboard Engineer] Updated April 13 record:`, {
                date: recordDate.format('YYYY-MM-DD'),
                projectId: record.projectId,
                engineerId: record.engineerId,
                periodKey,
                oldTotal: currentMinutes,
                adding: record.minutes,
                newTotal
              });
            }
          }
        }
      }
    });
    
    if (includeBreakdown) {
      // Build full matrix with engineer breakdown
      type MatrixRow = {
        project: { id: number; name: string };
        engineer: { id: string; name: string };
        periodHours: { [key: string]: number };
        totalHours: number;
      };
      
      const matrix: MatrixRow[] = [];
      
      // Process data for each project and engineer
      projectsMap.forEach((project, projectId) => {
        const projectEngineers = projectEngineerHoursMap.get(projectId);
        if (!projectEngineers) return;
        
        // Add a row for each engineer in this project
        engineersMap.forEach((engineer, engineerId) => {
          const engineerPeriods = projectEngineers.get(engineerId);
          if (!engineerPeriods) return;
          
          // Create a new row for this project and engineer
          const row: MatrixRow = {
            project: { 
              id: project.id,
              name: project.name 
            },
            engineer: {
              id: engineer.id,
              name: engineer.name
            },
            periodHours: {},
            totalHours: 0
          };
          
          // Convert minutes to hours and calculate totals
          let totalHours = 0;
          
          periods.forEach(period => {
            const minutes = engineerPeriods.get(period.key) || 0;
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
        
        // Add a total row for this project
        const projectTotalRow: MatrixRow = {
          project: { id: project.id, name: project.name },
          engineer: { id: 'total', name: 'Total' },
          periodHours: {},
          totalHours: 0
        };
        
        // Get project period totals
        const projectPeriods = projectHoursMap.get(projectId);
        if (projectPeriods) {
          periods.forEach(period => {
            const minutes = projectPeriods.get(period.key) || 0;
            const hours = Math.round(minutes / 60 * 10) / 10; // Round to 1 decimal
            
            projectTotalRow.periodHours[period.key] = hours;
            projectTotalRow.totalHours += hours;
          });
        }
        
        // Only add project totals if there's data
        if (projectTotalRow.totalHours > 0) {
          matrix.push(projectTotalRow);
        }
      });
      
      // Add a grand total row
      const grandTotalRow: MatrixRow = {
        project: { id: 0, name: 'All Projects' },
        engineer: { id: 'grand_total', name: 'Grand Total' },
        periodHours: {},
        totalHours: 0
      };
      
      // Calculate grand totals per period
      periods.forEach(period => {
        let totalForPeriod = 0;
        
        projectsMap.forEach((_, projectId) => {
          const projectPeriods = projectHoursMap.get(projectId);
          if (projectPeriods) {
            totalForPeriod += Math.round((projectPeriods.get(period.key) || 0) / 60 * 10) / 10;
          }
        });
        
        grandTotalRow.periodHours[period.key] = totalForPeriod;
        grandTotalRow.totalHours += totalForPeriod;
      });
      
      // Add the grand total row
      matrix.push(grandTotalRow);
      
      return {
        success: true,
        data: {
          periods,
          projects: Array.from(projectsMap.values()),
          engineers: Array.from(engineersMap.values()),
          matrix,
          totalsIncluded: true
        }
      };
    } else {
      // Simpler format for totals only
      type ProjectRow = {
        project: { id: number; name: string };
        periodHours: { [key: string]: number };
        totalHours: number;
      };
      
      const matrix: ProjectRow[] = [];
      
      // Add a row for each project
      projectsMap.forEach((project, projectId) => {
        const projectPeriods = projectHoursMap.get(projectId);
        if (!projectPeriods) return;
        
        // Create a new row for this project
        const row: ProjectRow = {
          project: { 
            id: project.id,
            name: project.name 
          },
          periodHours: {},
          totalHours: 0
        };
        
        // Convert minutes to hours and calculate totals
        periods.forEach(period => {
          const minutes = projectPeriods.get(period.key) || 0;
          const hours = Math.round(minutes / 60 * 10) / 10; // Round to 1 decimal
          
          row.periodHours[period.key] = hours;
          row.totalHours += hours;
        });
        
        // Only add rows for projects with logged time
        if (row.totalHours > 0) {
          matrix.push(row);
        }
      });
      
      // Add a grand total row
      const grandTotalRow: ProjectRow = {
        project: { id: 0, name: 'All Projects' },
        periodHours: {},
        totalHours: 0
      };
      
      // Calculate grand totals per period
      periods.forEach(period => {
        let totalForPeriod = 0;
        
        matrix.forEach(row => {
          totalForPeriod += row.periodHours[period.key] || 0;
        });
        
        grandTotalRow.periodHours[period.key] = totalForPeriod;
        grandTotalRow.totalHours += totalForPeriod;
      });
      
      // Add the grand total row
      matrix.push(grandTotalRow);
      
      return {
        success: true,
        data: {
          periods,
          projects: Array.from(projectsMap.values()),
          matrix,
          totalsIncluded: true
        }
      };
    }
  } catch (error) {
    console.error("Error generating dashboard engineer hours matrix:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}