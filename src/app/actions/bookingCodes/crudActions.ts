"use server";

import db from "@/db/getdb";
import {
  bookingCodeGroups,
  bookingCodes,
  projectBookingCodes,
  insertBookingCodeGroupSchema,
  insertBookingCodeSchema,
  insertProjectBookingCodeSchema,
  updateBookingCodeGroupSchema,
  updateBookingCodeSchema,
} from "@/db/schema/bookingCodes";
import { projects } from "@/db/schema/projects";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Define error type to replace any
type ErrorWithMessage = {
  message: string;
};

// BookingCodeGroup CRUD operations
export async function createBookingCodeGroup(data: {
  name: string;
  description?: string | null;
}) {
  try {
    const validatedData = insertBookingCodeGroupSchema.parse({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.insert(bookingCodeGroups).values(validatedData).returning();
    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error creating booking code group:", typedError);
    return { success: false, error: typedError.message || "Failed to create booking code group" };
  }
}

export async function updateBookingCodeGroup(
  id: number,
  data: { name?: string; description?: string | null }
) {
  try {
    const validatedData = updateBookingCodeGroupSchema.parse({
      ...data,
      updatedAt: new Date(),
    });

    const result = await db
      .update(bookingCodeGroups)
      .set(validatedData)
      .where(eq(bookingCodeGroups.id, id))
      .returning();

    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error updating booking code group:", typedError);
    return { success: false, error: typedError.message || "Failed to update booking code group" };
  }
}

export async function deleteBookingCodeGroup(id: number) {
  try {
    // Cascade deletion will handle related records
    const result = await db
      .delete(bookingCodeGroups)
      .where(eq(bookingCodeGroups.id, id))
      .returning();

    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error deleting booking code group:", typedError);
    return { success: false, error: typedError.message || "Failed to delete booking code group" };
  }
}

export async function getBookingCodeGroups() {
  try {
    const result = await db
      .select()
      .from(bookingCodeGroups)
      .orderBy(asc(bookingCodeGroups.name));
    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching booking code groups:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch booking code groups" };
  }
}

// Get booking code groups that are not yet assigned to a project
export async function getAvailableBookingCodeGroups(projectId: number) {
  try {
    // Get all booking code groups
    const allGroups = await db
      .select()
      .from(bookingCodeGroups)
      .orderBy(asc(bookingCodeGroups.name));
    
    // Get booking code groups already assigned to the project
    const assignedGroups = await db
      .select({
        bookingCodeGroupId: projectBookingCodes.bookingCodeGroupId,
      })
      .from(projectBookingCodes)
      .where(eq(projectBookingCodes.projectId, projectId));
    
    // Create a set of assigned group IDs for efficient lookup
    const assignedGroupIds = new Set(assignedGroups.map(group => group.bookingCodeGroupId));
    
    // Filter out already assigned groups
    const availableGroups = allGroups.filter(group => !assignedGroupIds.has(group.id));
    
    return { success: true, data: availableGroups };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching available booking code groups:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch available booking code groups" };
  }
}

export async function getBookingCodeGroupById(id: number) {
  try {
    const result = await db
      .select()
      .from(bookingCodeGroups)
      .where(eq(bookingCodeGroups.id, id));
    
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching booking code group:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch booking code group" };
  }
}

// BookingCode CRUD operations
export async function createBookingCode(data: {
  groupId: number;
  code: string;
  description?: string | null;
  validFrom: Date;
  validTo: Date;
  enabled: boolean;
}) {
  try {
    // Check for overlap with existing booking codes
    const overlapCheck = await checkBookingCodeOverlap(
      data.groupId,
      data.validFrom,
      data.validTo
    );
    
    if (!overlapCheck.success) {
      return { 
        success: false, 
        error: overlapCheck.error || "Failed to check for booking code overlap" 
      };
    }
    
    if (overlapCheck.hasOverlap) {
      return { 
        success: false, 
        error: "This date range would overlap with an existing active booking code in this group. There should only be one active booking code at a time." 
      };
    }
    
    const validatedData = insertBookingCodeSchema.parse({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.insert(bookingCodes).values(validatedData).returning();
    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error creating booking code:", typedError);
    return { success: false, error: typedError.message || "Failed to create booking code" };
  }
}

export async function updateBookingCode(
  id: number,
  data: {
    code?: string;
    description?: string | null;
    validFrom?: Date;
    validTo?: Date;
    enabled?: boolean;
  }
) {
  try {
    // Get the current booking code to check its groupId
    const currentBookingCode = await db
      .select()
      .from(bookingCodes)
      .where(eq(bookingCodes.id, id))
      .limit(1);
      
    if (currentBookingCode.length === 0) {
      return { success: false, error: "Booking code not found" };
    }
    
    // If dates are being updated, check for overlap
    if (data.validFrom !== undefined && data.validTo !== undefined) {
      const overlapCheck = await checkBookingCodeOverlap(
        currentBookingCode[0].groupId,
        data.validFrom,
        data.validTo,
        id // Exclude the current booking code from the check
      );
      
      if (!overlapCheck.success) {
        return { 
          success: false, 
          error: overlapCheck.error || "Failed to check for booking code overlap" 
        };
      }
      
      if (overlapCheck.hasOverlap) {
        return { 
          success: false, 
          error: "This date range would overlap with an existing active booking code in this group. There should only be one active booking code at a time." 
        };
      }
    }
    
    const validatedData = updateBookingCodeSchema.parse({
      ...data,
      updatedAt: new Date(),
    });

    const result = await db
      .update(bookingCodes)
      .set(validatedData)
      .where(eq(bookingCodes.id, id))
      .returning();

    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error updating booking code:", typedError);
    return { success: false, error: typedError.message || "Failed to update booking code" };
  }
}

export async function deleteBookingCode(id: number) {
  try {
    const result = await db
      .delete(bookingCodes)
      .where(eq(bookingCodes.id, id))
      .returning();

    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error deleting booking code:", typedError);
    return { success: false, error: typedError.message || "Failed to delete booking code" };
  }
}

export async function getBookingCodes(groupId?: number) {
  try {
    if (groupId) {
      const result = await db
        .select()
        .from(bookingCodes)
        .where(eq(bookingCodes.groupId, groupId))
        .orderBy(desc(bookingCodes.validFrom));
      return { success: true, data: result };
    }
    
    const result = await db
      .select()
      .from(bookingCodes)
      .orderBy(desc(bookingCodes.validFrom));
    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching booking codes:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch booking codes" };
  }
}

export async function getBookingCodeById(id: number) {
  try {
    const result = await db
      .select()
      .from(bookingCodes)
      .where(eq(bookingCodes.id, id));
    
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching booking code:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch booking code" };
  }
}

// Get active booking code for a group (based on current date)
export async function getActiveBookingCode(groupId: number) {
  try {
    const now = new Date();
    
    // Try to get the currently active booking code
    const activeCode = await db
      .select()
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
      return { success: true, data: activeCode[0] };
    }

    // If no active code, get the most recent expired one
    const recentExpired = await db
      .select()
      .from(bookingCodes)
      .where(
        and(
          eq(bookingCodes.groupId, groupId),
          lt(bookingCodes.validTo, now)
        )
      )
      .orderBy(desc(bookingCodes.validTo))
      .limit(1);

    return { 
      success: true, 
      data: recentExpired.length > 0 ? recentExpired[0] : null,
      isExpired: recentExpired.length > 0
    };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching active booking code:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch active booking code" };
  }
}


/**
 * Checks if a booking code with the given date range would overlap with existing booking codes in the same group
 * @param groupId The ID of the booking code group to check
 * @param validFrom The start date of the booking code
 * @param validTo The end date of the booking code
 * @param excludeBookingCodeId Optional booking code ID to exclude from the check (useful for edit operations)
 * @returns True if there's an overlap with an existing active booking code, false otherwise
 */
export async function checkBookingCodeOverlap(
  groupId: number,
  validFrom: Date,
  validTo: Date,
  excludeBookingCodeId?: number
): Promise<{ success: boolean; hasOverlap: boolean; error?: string }> {
  try {
    // Build the base query conditions
    let conditions = and(
      eq(bookingCodes.groupId, groupId),
      eq(bookingCodes.enabled, true),
      // Check for overlap: 
      // (new start date < existing end date) AND (new end date > existing start date)
      lt(bookingCodes.validFrom, validTo),
      gte(bookingCodes.validTo, validFrom)
    );
    
    // If we're editing an existing booking code, exclude it from the check
    if (excludeBookingCodeId) {
      conditions = and(conditions, 
        // Exclude the booking code being edited
        eq(bookingCodes.id, excludeBookingCodeId, true) // eq(x, y, true) is equivalent to NOT eq
      );
    }
    
    // Check for any overlapping active booking codes
    const overlappingCodes = await db
      .select()
      .from(bookingCodes)
      .where(conditions)
      .limit(1);
    
    return { 
      success: true, 
      hasOverlap: overlappingCodes.length > 0 
    };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error checking booking code overlap:", typedError);
    return { 
      success: false, 
      hasOverlap: false, 
      error: typedError.message || "Failed to check booking code overlap" 
    };
  }
}

// ProjectBookingCode CRUD operations
export async function assignBookingCodeToProject(data: {
  projectId: number;
  bookingCodeGroupId: number;
}) {
  try {
    const validatedData = insertProjectBookingCodeSchema.parse({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.insert(projectBookingCodes).values(validatedData).returning();
    revalidatePath("/project/booking-codes");
    revalidatePath(`/project/${data.projectId}`);
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error assigning booking code to project:", typedError);
    return { success: false, error: typedError.message || "Failed to assign booking code to project" };
  }
}

export async function removeBookingCodeFromProject(projectId: number, bookingCodeGroupId: number) {
  try {
    const result = await db
      .delete(projectBookingCodes)
      .where(
        and(
          eq(projectBookingCodes.projectId, projectId),
          eq(projectBookingCodes.bookingCodeGroupId, bookingCodeGroupId)
        )
      )
      .returning();

    revalidatePath("/project/booking-codes");
    revalidatePath(`/project/${projectId}`);
    return { success: true, data: result[0] };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error removing booking code from project:", typedError);
    return { success: false, error: typedError.message || "Failed to remove booking code from project" };
  }
}

export async function getProjectBookingCodes(projectId: number) {
  try {
    const result = await db
      .select({
        id: projectBookingCodes.id,
        projectId: projectBookingCodes.projectId,
        bookingCodeGroupId: projectBookingCodes.bookingCodeGroupId,
        groupName: bookingCodeGroups.name,
        groupDescription: bookingCodeGroups.description,
      })
      .from(projectBookingCodes)
      .innerJoin(
        bookingCodeGroups,
        eq(projectBookingCodes.bookingCodeGroupId, bookingCodeGroups.id)
      )
      .where(eq(projectBookingCodes.projectId, projectId));

    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching project booking codes:", typedError);
    return { success: false, error: typedError.message || "Failed to fetch project booking codes" };
  }
}

// Complex queries for UI
export async function getBookingCodeGroupsWithCodes() {
  try {
    const groups = await db
      .select()
      .from(bookingCodeGroups)
      .orderBy(asc(bookingCodeGroups.name));

    const result = await Promise.all(
      groups.map(async (group) => {
        const codes = await db
          .select()
          .from(bookingCodes)
          .where(eq(bookingCodes.groupId, group.id))
          .orderBy(desc(bookingCodes.validFrom));

        return {
          ...group,
          codes,
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching booking code groups with codes:", typedError);
    return {
      success: false,
      error: typedError.message || "Failed to fetch booking code groups with codes",
    };
  }
}

export async function getProjectsWithBookingCodes() {
  try {
    const result = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        bookingCodeGroupId: projectBookingCodes.bookingCodeGroupId,
        bookingCodeGroupName: bookingCodeGroups.name,
      })
      .from(projects)
      .leftJoin(
        projectBookingCodes,
        eq(projects.id, projectBookingCodes.projectId)
      )
      .leftJoin(
        bookingCodeGroups,
        eq(projectBookingCodes.bookingCodeGroupId, bookingCodeGroups.id)
      )
      .orderBy(asc(projects.name));

    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching projects with booking codes:", typedError);
    return {
      success: false,
      error: typedError.message || "Failed to fetch projects with booking codes",
    };
  }
}

// Get all booking code groups for a project with their active booking codes
export async function getProjectBookingCodeGroups(projectId: number) {
  try {
    // Get all booking code groups assigned to the project
    const projectBookingCodeGroups = await db
      .select({
        id: projectBookingCodes.id,
        projectId: projectBookingCodes.projectId,
        bookingCodeGroupId: projectBookingCodes.bookingCodeGroupId,
        groupName: bookingCodeGroups.name,
      })
      .from(projectBookingCodes)
      .innerJoin(
        bookingCodeGroups,
        eq(projectBookingCodes.bookingCodeGroupId, bookingCodeGroups.id)
      )
      .where(eq(projectBookingCodes.projectId, projectId));

    if (projectBookingCodeGroups.length === 0) {
      return { success: true, data: [] };
    }

    // Get the active booking code for each group
    const result = await Promise.all(
      projectBookingCodeGroups.map(async (group) => {
        const activeCodeResult = await getActiveBookingCode(group.bookingCodeGroupId);
        
        return {
          id: group.id,
          projectId: group.projectId,
          bookingCodeGroupId: group.bookingCodeGroupId,
          groupName: group.groupName,
          activeBookingCode: activeCodeResult.success ? activeCodeResult.data : null,
          isExpired: activeCodeResult.isExpired || false,
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching project booking code groups:", typedError);
    return {
      success: false,
      error: typedError.message || "Failed to fetch project booking code groups",
    };
  }
}

// Get active booking code for a project
export async function getProjectActiveBookingCode(projectId: number) {
  try {
    // First get the booking code group assigned to the project
    const projectBookingCode = await db
      .select({
        projectId: projectBookingCodes.projectId,
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
      return { success: true, data: null };
    }

    // Then get the active booking code for that group
    const activeCodeResult = await getActiveBookingCode(projectBookingCode[0].bookingCodeGroupId);
    
    if (!activeCodeResult.success || !activeCodeResult.data) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        ...activeCodeResult.data,
        groupName: projectBookingCode[0].groupName,
        isExpired: activeCodeResult.isExpired || false,
      },
    };
  } catch (error) {
    const typedError = error as ErrorWithMessage;
    console.error("Error fetching project active booking code:", typedError);
    return {
      success: false,
      error: typedError.message || "Failed to fetch project active booking code",
    };
  }
}
