'use server';

import { db } from "@/db";
import { servers } from "@/db/schema";
import { count, sql } from "drizzle-orm";

// Get server activity (creation/updates) over the past 30 days
export async function getRecentServerActivity() {
  try {
    // Get server additions per day for the last 30 days
    const creationActivity = await db
      .select({
        date: sql`DATE(created_at)`,
        count: count(),
      })
      .from(servers)
      .where(sql`created_at >= CURRENT_DATE - INTERVAL '30 days'`)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    // Get server updates per day for the last 30 days
    const updateActivity = await db
      .select({
        date: sql`DATE(updated_at)`,
        count: count(),
      })
      .from(servers)
      .where(sql`updated_at >= CURRENT_DATE - INTERVAL '30 days'`)
      .groupBy(sql`DATE(updated_at)`)
      .orderBy(sql`DATE(updated_at)`);

    // Generate a list of the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 29 + i); // Start from 29 days ago
      return {
        date: date.toISOString().split('T')[0],
        created: 0,
        updated: 0,
      };
    });

    // Populate with actual data
    creationActivity.forEach(item => {
      if (item.date) {
        // Ensure date is a string or Date object before converting
        const dateObj = item.date instanceof Date ? item.date : new Date(String(item.date));
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayEntry = last30Days.find(day => day.date === dateStr);
        if (dayEntry) {
          dayEntry.created = Number(item.count);
        }
      }
    });

    updateActivity.forEach(item => {
      if (item.date) {
        // Ensure date is a string or Date object before converting
        const dateObj = item.date instanceof Date ? item.date : new Date(String(item.date));
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayEntry = last30Days.find(day => day.date === dateStr);
        if (dayEntry) {
          dayEntry.updated = Number(item.count);
        }
      }
    });

    return last30Days;
  } catch (error) {
    console.error("Error getting recent server activity:", error);
    return [];
  }
}
