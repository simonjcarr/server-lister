import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get unread notification count from database
    const queryResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    
    // Return the count as JSON with cache control headers
    return NextResponse.json(
      { count: queryResult[0].count },
      { 
        headers: {
          // Prevent caching to ensure fresh data
          "Cache-Control": "no-store, max-age=0",
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
