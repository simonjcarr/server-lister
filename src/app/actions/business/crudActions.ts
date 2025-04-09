"use server";

import { db, getTestDb, isTestEnvironment } from '@/db';
import { business as businessTable } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export interface BusinessFormData {
  name: string;
}

function getTestDbForOperation() {
  if(isTestEnvironment()) return getTestDb();
  return db;
}

/**
 * Retrieves all businesses
 */
export async function getBusinesses() {
  const currentDb = getTestDbForOperation();
  try {
    const allBusinesses = await currentDb.select().from(businessTable).orderBy(businessTable.name);
    return allBusinesses
  } catch (error: unknown) {
    console.error('Error fetching businesses:', error as Error);
    throw new Error('Failed to fetch businesses');
  }
}

/**
 * Retrieves a business by ID
 */
export async function getBusinessById(id: number) {
  const currentDb = getTestDbForOperation();
  try {
    const businessData = await currentDb.select().from(businessTable).where(eq(businessTable.id, id)).limit(1);
    if (businessData.length === 0) {
      throw new Error('Business not found');
    }
    return businessData[0];
  } catch (error: unknown) {
    console.error(`Error fetching business with ID ${id}:`, error as Error);
    throw new Error('Failed to fetch business');
  }
}

/**
 * Creates a new business with the provided data
 */
export async function createBusiness(formData: BusinessFormData) {
  const currentDb = getTestDbForOperation();
  try {
    const now = new Date();
    
    const result = await currentDb.insert(businessTable).values({
      name: formData.name,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    revalidatePath('/business/list');
    return result[0];
  } catch (error: unknown) {
    console.error('Error creating business:', error as Error);
    throw new Error('Failed to create business', error as Error);
  }
}

/**
 * Updates a business by ID
 */
export async function updateBusiness(id: number, formData: Partial<BusinessFormData>) {
  const currentDb = getTestDbForOperation();
  try {
    const now = new Date();
    
    const result = await currentDb.update(businessTable)
      .set({
        ...formData,
        updatedAt: now,
      })
      .where(eq(businessTable.id, id))
      .returning();
    
    if (result.length === 0) {
      return { success: false, error: 'Business not found' };
    }
    
    revalidatePath('/business/list');
    return { success: true, data: result[0] };
  } catch (error: unknown) {
    console.error(`Error updating business with ID ${id}:`, error as Error);
    return { 
      success: false, 
      error: (error as Error).message || 'Failed to update business' 
    };
  }
}

/**
 * Deletes a business by ID
 */
export async function deleteBusiness(id: number) {
  const currentDb = getTestDbForOperation();
  try {
    const result = await currentDb.delete(businessTable)
      .where(eq(businessTable.id, id))
      .returning();
    
    if (result.length === 0) {
      return { success: false, error: 'Business not found' };
    }
    
    revalidatePath('/business/list');
    return { success: true, data: result[0] };
  } catch (error: unknown) {
    console.error(`Error deleting business with ID ${id}:`, error as Error);
    return { 
      success: false, 
      error: (error as Error).message || 'Failed to delete business' 
    };
  }
}
