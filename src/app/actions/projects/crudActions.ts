"use server";

import { db } from '@/db';
import { projects } from '@/db/schema';
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
    const allProjects = await db.select().from(projects).orderBy(projects.name);
    return allProjects
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch projects');
  }
}

/**
 * Retrieves a project by ID
 */
export async function getProjectById(id: number) {
  try {
    const projectData = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
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