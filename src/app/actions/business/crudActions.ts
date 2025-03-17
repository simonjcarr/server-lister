"use server";

import { db } from '@/db';
import { business as businessTable } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export interface BusinessFormData {
  name: string;
}

/**
 * Retrieves all businesses
 */
export async function getBusinesses() {
  try {
    const allBusinesses = await db.select().from(businessTable).orderBy(businessTable.name);
    return { success: true, data: allBusinesses };
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch businesses' 
    };
  }
}

/**
 * Retrieves a business by ID
 */
export async function getBusinessById(id: number) {
  try {
    const businessData = await db.select().from(businessTable).where(eq(businessTable.id, id)).limit(1);
    if (businessData.length === 0) {
      throw new Error('Business not found');
    }
    return businessData[0];
  } catch (error: any) {
    console.error(`Error fetching business with ID ${id}:`, error);
    throw new Error('Failed to fetch business');
  }
}

/**
 * Creates a new business with the provided data
 */
export async function createBusiness(formData: BusinessFormData) {
  try {
    const now = new Date();
    
    const result = await db.insert(businessTable).values({
      name: formData.name,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    revalidatePath('/business/list');
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error('Error creating business:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create business' 
    };
  }
}

/**
 * Updates a business by ID
 */
export async function updateBusiness(id: number, formData: Partial<BusinessFormData>) {
  try {
    const now = new Date();
    
    const result = await db.update(businessTable)
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
  } catch (error: any) {
    console.error(`Error updating business with ID ${id}:`, error);
    return { 
      success: false, 
      error: error.message || 'Failed to update business' 
    };
  }
}

/**
 * Deletes a business by ID
 */
export async function deleteBusiness(id: number) {
  try {
    const result = await db.delete(businessTable)
      .where(eq(businessTable.id, id))
      .returning();
    
    if (result.length === 0) {
      return { success: false, error: 'Business not found' };
    }
    
    revalidatePath('/business/list');
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error(`Error deleting business with ID ${id}:`, error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete business' 
    };
  }
}
