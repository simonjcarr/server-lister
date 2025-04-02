'use server';

import { db } from '@/db';
import { softwareWhitelist, softwareWhitelistVersions, osFamily } from '@/db/schema';
import { InsertSoftwareWhitelist, UpdateSoftwareWhitelist } from '@/db/schema/softwareWhitelist';
import { InsertSoftwareWhitelistVersion, UpdateSoftwareWhitelistVersion } from '@/db/schema/softwareWhitelist';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Whitelist Item Actions
export async function fetchSoftwareWhitelist() {
  try {
    const result = await db
      .select({
        id: softwareWhitelist.id,
        name: softwareWhitelist.name,
        description: softwareWhitelist.description,
        osFamilyId: softwareWhitelist.osFamilyId,
        osFamilyName: osFamily.name,
        createdAt: softwareWhitelist.createdAt,
        updatedAt: softwareWhitelist.updatedAt,
      })
      .from(softwareWhitelist)
      .leftJoin(osFamily, eq(softwareWhitelist.osFamilyId, osFamily.id));
    
    return result;
  } catch (error) {
    console.error('Error fetching software whitelist:', error);
    throw new Error('Failed to fetch software whitelist');
  }
}

export async function fetchSoftwareWhitelistItem(id: number) {
  try {
    const result = await db
      .select()
      .from(softwareWhitelist)
      .where(eq(softwareWhitelist.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error(`Error fetching software whitelist item ${id}:`, error);
    throw new Error('Failed to fetch software whitelist item');
  }
}

export async function createSoftwareWhitelist(data: InsertSoftwareWhitelist) {
  try {
    const now = new Date();
    const result = await db.insert(softwareWhitelist).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    revalidatePath('/whitelist');
    return result[0];
  } catch (error) {
    console.error('Error creating software whitelist item:', error);
    throw new Error('Failed to create software whitelist item');
  }
}

export async function updateSoftwareWhitelist(id: number, data: UpdateSoftwareWhitelist) {
  try {
    const now = new Date();
    const result = await db
      .update(softwareWhitelist)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(softwareWhitelist.id, id))
      .returning();
    
    revalidatePath('/whitelist');
    return result[0];
  } catch (error) {
    console.error(`Error updating software whitelist item ${id}:`, error);
    throw new Error('Failed to update software whitelist item');
  }
}

export async function deleteSoftwareWhitelist(id: number) {
  try {
    // First delete all related versions (cascade should handle this, but being explicit)
    await db
      .delete(softwareWhitelistVersions)
      .where(eq(softwareWhitelistVersions.softwareWhitelistId, id));
    
    // Then delete the whitelist item
    const result = await db
      .delete(softwareWhitelist)
      .where(eq(softwareWhitelist.id, id))
      .returning();
    
    revalidatePath('/whitelist');
    return result[0];
  } catch (error) {
    console.error(`Error deleting software whitelist item ${id}:`, error);
    throw new Error('Failed to delete software whitelist item');
  }
}

// Whitelist Version Actions
export async function fetchVersionsForSoftware(softwareWhitelistId: number) {
  try {
    const result = await db
      .select()
      .from(softwareWhitelistVersions)
      .where(eq(softwareWhitelistVersions.softwareWhitelistId, softwareWhitelistId))
      .orderBy(softwareWhitelistVersions.versionPattern);
    
    return result;
  } catch (error) {
    console.error(`Error fetching versions for software ${softwareWhitelistId}:`, error);
    throw new Error('Failed to fetch software versions');
  }
}

export async function fetchVersionById(id: number) {
  try {
    const result = await db
      .select()
      .from(softwareWhitelistVersions)
      .where(eq(softwareWhitelistVersions.id, id))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error(`Error fetching version ${id}:`, error);
    throw new Error('Failed to fetch version');
  }
}

export async function createSoftwareVersion(data: InsertSoftwareWhitelistVersion) {
  try {
    const now = new Date();
    const result = await db.insert(softwareWhitelistVersions).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning();
    
    revalidatePath(`/whitelist/versions/${data.softwareWhitelistId}`);
    return result[0];
  } catch (error) {
    console.error('Error creating software version:', error);
    throw new Error('Failed to create software version');
  }
}

export async function updateSoftwareVersion(id: number, data: UpdateSoftwareWhitelistVersion) {
  try {
    const now = new Date();
    const result = await db
      .update(softwareWhitelistVersions)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(softwareWhitelistVersions.id, id))
      .returning();
    
    // Get the software ID to revalidate the correct path
    const version = await fetchVersionById(id);
    if (version) {
      revalidatePath(`/whitelist/versions/${version.softwareWhitelistId}`);
    }
    
    return result[0];
  } catch (error) {
    console.error(`Error updating software version ${id}:`, error);
    throw new Error('Failed to update software version');
  }
}

export async function deleteSoftwareVersion(id: number) {
  try {
    // Get the software ID first to revalidate the correct path
    const version = await fetchVersionById(id);
    
    const result = await db
      .delete(softwareWhitelistVersions)
      .where(eq(softwareWhitelistVersions.id, id))
      .returning();
    
    if (version) {
      revalidatePath(`/whitelist/versions/${version.softwareWhitelistId}`);
    }
    
    return result[0];
  } catch (error) {
    console.error(`Error deleting software version ${id}:`, error);
    throw new Error('Failed to delete software version');
  }
}

// OS Family Actions (for dropdowns)
export async function fetchOSFamilies() {
  try {
    const result = await db
      .select()
      .from(osFamily)
      .orderBy(osFamily.name);
    
    return result;
  } catch (error) {
    console.error('Error fetching OS families:', error);
    throw new Error('Failed to fetch OS families');
  }
}
