"use server";

import { db } from "@/db";
import {
  bookingCodeGroups,
  bookingCodes,
  projectBookingCodes,
  insertBookingCodeGroupSchema,
  insertBookingCodeSchema,
  insertProjectBookingCodeSchema,
  updateBookingCodeGroupSchema,
  updateBookingCodeSchema,
  SelectBookingCodeGroup,
  SelectBookingCode,
  SelectProjectBookingCode,
} from "@/db/schema/bookingCodes";
import { projects } from "@/db/schema/projects";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  } catch (error: any) {
    console.error("Error creating booking code group:", error);
    return { success: false, error: error.message || "Failed to create booking code group" };
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
  } catch (error: any) {
    console.error("Error updating booking code group:", error);
    return { success: false, error: error.message || "Failed to update booking code group" };
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
  } catch (error: any) {
    console.error("Error deleting booking code group:", error);
    return { success: false, error: error.message || "Failed to delete booking code group" };
  }
}

export async function getBookingCodeGroups() {
  try {
    const result = await db
      .select()
      .from(bookingCodeGroups)
      .orderBy(asc(bookingCodeGroups.name));
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error fetching booking code groups:", error);
    return { success: false, error: error.message || "Failed to fetch booking code groups" };
  }
}

export async function getBookingCodeGroupById(id: number) {
  try {
    const result = await db
      .select()
      .from(bookingCodeGroups)
      .where(eq(bookingCodeGroups.id, id));
    
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error("Error fetching booking code group:", error);
    return { success: false, error: error.message || "Failed to fetch booking code group" };
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
    const validatedData = insertBookingCodeSchema.parse({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.insert(bookingCodes).values(validatedData).returning();
    revalidatePath("/project/booking-codes");
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error("Error creating booking code:", error);
    return { success: false, error: error.message || "Failed to create booking code" };
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
  } catch (error: any) {
    console.error("Error updating booking code:", error);
    return { success: false, error: error.message || "Failed to update booking code" };
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
  } catch (error: any) {
    console.error("Error deleting booking code:", error);
    return { success: false, error: error.message || "Failed to delete booking code" };
  }
}

export async function getBookingCodes(groupId?: number) {
  try {
    let query = db
      .select()
      .from(bookingCodes)
      .orderBy(desc(bookingCodes.validFrom));

    if (groupId) {
      query = query.where(eq(bookingCodes.groupId, groupId));
    }

    const result = await query;
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error fetching booking codes:", error);
    return { success: false, error: error.message || "Failed to fetch booking codes" };
  }
}

export async function getBookingCodeById(id: number) {
  try {
    const result = await db
      .select()
      .from(bookingCodes)
      .where(eq(bookingCodes.id, id));
    
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error("Error fetching booking code:", error);
    return { success: false, error: error.message || "Failed to fetch booking code" };
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
  } catch (error: any) {
    console.error("Error fetching active booking code:", error);
    return { success: false, error: error.message || "Failed to fetch active booking code" };
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
  } catch (error: any) {
    console.error("Error assigning booking code to project:", error);
    return { success: false, error: error.message || "Failed to assign booking code to project" };
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
  } catch (error: any) {
    console.error("Error removing booking code from project:", error);
    return { success: false, error: error.message || "Failed to remove booking code from project" };
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
  } catch (error: any) {
    console.error("Error fetching project booking codes:", error);
    return { success: false, error: error.message || "Failed to fetch project booking codes" };
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
  } catch (error: any) {
    console.error("Error fetching booking code groups with codes:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch booking code groups with codes",
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
  } catch (error: any) {
    console.error("Error fetching projects with booking codes:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch projects with booking codes",
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
  } catch (error: any) {
    console.error("Error fetching project active booking code:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch project active booking code",
    };
  }
}
