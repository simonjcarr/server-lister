"use server";

import { db } from '@/db';
import { projects, business, primaryProjectEngineers, users, drawings } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import type { InsertProject } from '@/db/schema';

export interface ProjectFormData {
  name: string;
  description?: string;
  business?: number;
  code?: string;
}

/**
 * Creates a new project with the provided data
 */
export async function createProject(formData: InsertProject) {
  try {
    const result = await db.insert(projects).values({
      name: formData.name,
      description: formData.description,
      business: formData.business,
      code: formData.code,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    revalidatePath('/project/list');
    return { success: true, data: result[0] };
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    };
  }
}

/**
 * Retrieves all projects
 */
export async function getProjects() {
  try {
    const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      businessName: business.name,
      businessId: projects.business,
      code: projects.code,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(business, eq(projects.business, business.id))
    .orderBy(projects.name);
    return allProjects
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch projects');
  }
}

export type ProjectData = {
  id: number;
  name: string;
  description: string | null;
  businessName: string | null;
  businessId: number | null;
  code: string | null;
  createdAt: Date;
  updatedAt: Date;
};


/**
 * Retrieves a project by ID
 */
export async function getProjectById(id: number) {
  try {
    const projectData = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      businessName: business.name,
      businessId: projects.business,
      code: projects.code,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(business, eq(projects.business, business.id))
    .where(eq(projects.id, id))
    .limit(1);
    if (projectData.length === 0) {
      throw new Error('Project not found');
    }
    return projectData[0]
  } catch (error: unknown) {
    console.error(`Error fetching project with ID ${id}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch project');
  }
}

/**
 * Updates a project by ID
 */
export async function updateProject(id: number, formData: Partial<ProjectFormData>) {
  try {
    const result = await db.update(projects)
      .set({
        ...formData,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    
    if (result.length === 0) {
      return { success: false, error: 'Project not found' };
    }
    
    revalidatePath('/project/list');
    return { success: true, data: result[0] };
  } catch (error: unknown) {
    console.error(`Error updating project with ID ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update project' 
    };
  }
}

/**
 * Deletes a project by ID
 */
export async function deleteProject(id: number) {
  try {
    const result = await db.delete(projects)
      .where(eq(projects.id, id))
      .returning();
    
    if (result.length === 0) {
      return { success: false, error: 'Project not found' };
    }
    
    revalidatePath('/project/list');
    return { success: true, data: result[0] };
  } catch (error: unknown) {
    console.error(`Error deleting project with ID ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete project' 
    };
  }
}

export async function getPrimaryProjectEngineers(projectId: number) {
  try {
    const engineers = await db
      .select({
        id: primaryProjectEngineers.userId,
        name: users.name,
        email: users.email,
        projectId: primaryProjectEngineers.projectId
      })
      .from(primaryProjectEngineers)
      .innerJoin(users, eq(primaryProjectEngineers.userId, users.id))
      .where(eq(primaryProjectEngineers.projectId, projectId));
    return engineers;
  } catch (error: unknown) {
    console.error(`Error fetching primary engineers for project with ID ${projectId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch primary engineers');
  }
}

export async function getPrimaryProjectEngineerIDs(projectId: number) {
  try {
    const engineers = await db
      .select({
        id: primaryProjectEngineers.userId,
      })
      .from(primaryProjectEngineers)
      .where(eq(primaryProjectEngineers.projectId, projectId));
    return engineers.map(pe => pe.id);
  } catch (error: unknown) {
    console.error(`Error fetching primary engineers for project with ID ${projectId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch primary engineers');
  }
}

export async function updatePrimaryProjectEngineers(projectId: number, userIds: string[]) {
  try {
    await db.delete(primaryProjectEngineers)
      .where(eq(primaryProjectEngineers.projectId, projectId));
    
    await db.insert(primaryProjectEngineers)
      .values(userIds.map((userId) => ({
        projectId,
        userId
      }))).returning();
    
    return true;
  } catch (error: unknown) {
    console.error(`Error updating primary engineers for project with ID ${projectId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update primary engineers');
  }
}


  
export async function getProjectDrawings(projectId: number) {
  try {
    const drawingsResult = await db
      .select({
        id: drawings.id,
        name: drawings.name,
        projectId: drawings.projectId
      })
      .from(drawings)
      .where(eq(drawings.projectId, projectId));
    return drawingsResult;
  } catch (error: unknown) {
    console.error(`Error fetching drawings for project with ID ${projectId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch drawings');
  }
}

export async function getProjectDrawing(drawingId: number) {
  try {
    const drawing = await db
      .select()
      .from(drawings)
      .where(eq(drawings.id, drawingId));
    return drawing[0];
  } catch (error: unknown) {
    console.error(`Error fetching drawing with ID ${drawingId}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch drawing');
  }
}


  
  
  
  
  