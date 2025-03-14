import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// API endpoint to set admin role for a user
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Update user with admin role
    const currentRoles = user.roles as string[] || [];
    
    // Add admin role if not already present
    if (!currentRoles.includes('admin')) {
      const updatedRoles = [...currentRoles, 'admin'];
      
      // Update the user
      await db
        .update(users)
        .set({ roles: updatedRoles })
        .where(eq(users.id, userId));
      
      return NextResponse.json({ 
        success: true, 
        message: "Admin role added successfully",
        roles: updatedRoles
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User already has admin role",
      roles: currentRoles
    });
    
  } catch (error) {
    console.error("Error setting admin role:", error);
    return NextResponse.json({ error: "Failed to set admin role" }, { status: 500 });
  }
}

// Get list of users with their roles
export async function GET() {
  try {
    const allUsers = await db
      .select()
      .from(users);
    
    // Format the response
    const formattedUsers = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
    }));
    
    return NextResponse.json(formattedUsers);
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
