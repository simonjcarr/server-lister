'use server';

import db from '@/db/getdb';
import { buildDocs, buildDocSections, buildDocSectionTemplates } from '@/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types for build doc actions
export type BuildDocWithSections = Awaited<ReturnType<typeof getBuildDoc>>;
// Define the BuildDocSection type for section data
export type BuildDocSection = {
  id: number;
  buildDocId: number;
  parentSectionId: number | null;
  title: string;
  content: string | null;
  order: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};
// Define the BuildDocTemplate type for template data
export type BuildDocTemplate = {
  id: number;
  title: string;
  content: string | null;
  tags: string[] | null;
  isPublic: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

// Get all build docs for a server
export async function getServerBuildDocs(serverId: number) {
  try {
    const docs = await db.select()
      .from(buildDocs)
      .where(eq(buildDocs.serverId, serverId))
      .orderBy(desc(buildDocs.updatedAt));

    return { success: true, data: docs };
  } catch (error) {
    console.error('Error fetching build docs:', error);
    return { success: false, error: 'Failed to fetch build docs' };
  }
}

// Get a single build doc with its sections
export async function getBuildDoc(buildDocId: number) {
  try {
    const doc = await db.query.buildDocs.findFirst({
      where: eq(buildDocs.id, buildDocId),
    });

    if (!doc) {
      return { success: false, error: 'Build doc not found' };
    }

    return { success: true, data: doc };
  } catch (error) {
    console.error('Error fetching build doc:', error);
    return { success: false, error: 'Failed to fetch build doc' };
  }
}

// Get all sections for a build doc
export async function getBuildDocSections(buildDocId: number) {
  try {
    const sections = await db.select()
      .from(buildDocSections)
      .where(eq(buildDocSections.buildDocId, buildDocId))
      .orderBy(buildDocSections.order);

    return { success: true, data: sections };
  } catch (error) {
    console.error('Error fetching build doc sections:', error);
    return { success: false, error: 'Failed to fetch build doc sections' };
  }
}

// Get root sections for a build doc (sections with no parent)
export async function getRootBuildDocSections(buildDocId: number) {
  try {
    const sections = await db.select()
      .from(buildDocSections)
      .where(
        and(
          eq(buildDocSections.buildDocId, buildDocId),
          isNull(buildDocSections.parentSectionId)
        )
      )
      .orderBy(buildDocSections.order);

    return sections;
  } catch (error) {
    console.error('Error fetching root build doc sections:', error);
    throw new Error('Failed to fetch root build doc sections');
  }
}

// Get child sections for a parent section
export async function getChildBuildDocSections(parentSectionId: number) {
  try {
    const sections = await db.select()
      .from(buildDocSections)
      .where(eq(buildDocSections.parentSectionId, parentSectionId))
      .orderBy(buildDocSections.order);

    return sections;
  } catch (error) {
    console.error('Error fetching child build doc sections:', error);
    throw new Error('Failed to fetch child build doc sections');
  }
}

// Get all build doc section templates
export async function getBuildDocSectionTemplates(publicOnly: boolean = true) {
  try {
    // Use a more specific approach to avoid typing issues
    let templates;
    
    if (publicOnly) {
      templates = await db.select()
        .from(buildDocSectionTemplates)
        .where(eq(buildDocSectionTemplates.isPublic, true))
        .orderBy(buildDocSectionTemplates.title);
    } else {
      templates = await db.select()
        .from(buildDocSectionTemplates)
        .orderBy(buildDocSectionTemplates.title);
    }
    

    return { success: true, data: templates };
  } catch (error) {
    console.error('Error fetching build doc section templates:', error);
    return { success: false, error: 'Failed to fetch build doc section templates' };
  }
}

// Create a new build doc
export async function createBuildDoc(data: { 
  serverId: number; 
  title: string; 
  description?: string; 
  userId: string;
}) {
  const { serverId, title, description, userId } = data;
  
  try {
    const [newDoc] = await db.insert(buildDocs)
      .values({
        serverId,
        title,
        description: description || null,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath(`/server/view/${serverId}/build-docs`);
    return { success: true, data: newDoc };
  } catch (error) {
    console.error('Error creating build doc:', error);
    return { success: false, error: 'Failed to create build doc' };
  }
}

// Update a build doc
export async function updateBuildDoc(data: { 
  id: number; 
  title?: string; 
  description?: string; 
  userId: string;
}) {
  const { id, title, description, userId } = data;
  
  try {
    const [updatedDoc] = await db.update(buildDocs)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(buildDocs.id, id))
      .returning();

    if (!updatedDoc) {
      return { success: false, error: 'Build doc not found' };
    }

    revalidatePath(`/server/view/${updatedDoc.serverId}/build-docs`);
    return { success: true, data: updatedDoc };
  } catch (error) {
    console.error('Error updating build doc:', error);
    return { success: false, error: 'Failed to update build doc' };
  }
}

// Delete a build doc
export async function deleteBuildDoc(id: number, serverId: number) {
  try {
    await db.delete(buildDocs).where(eq(buildDocs.id, id));

    revalidatePath(`/server/view/${serverId}/build-docs`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting build doc:', error);
    return { success: false, error: 'Failed to delete build doc' };
  }
}

// Create a new build doc section
export async function createBuildDocSection(data: { 
  buildDocId: number; 
  parentSectionId?: number; 
  title: string; 
  content?: string; 
  order?: number;
  userId: string;
}) {
  const { buildDocId, parentSectionId, title, content, order = 0, userId } = data;
  
  try {
    const [newSection] = await db.insert(buildDocSections)
      .values({
        buildDocId,
        parentSectionId: parentSectionId || null,
        title,
        content: content || null,
        order,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const buildDocResult = await getBuildDoc(buildDocId);
    
    if (buildDocResult.success && buildDocResult.data) {
      revalidatePath(`/server/view/${buildDocResult.data.serverId}/build-docs/${buildDocId}`);
    }
    
    return { success: true, data: newSection };
  } catch (error) {
    console.error('Error creating build doc section:', error);
    return { success: false, error: 'Failed to create build doc section' };
  }
}

// Update a build doc section
export async function updateBuildDocSection(data: { 
  id: number; 
  title?: string; 
  content?: string; 
  order?: number;
  parentSectionId?: number | null; // Added to support reparenting
  userId: string;
}) {
  const { id, title, content, order, parentSectionId, userId } = data;
  
  try {
    const existingSection = await db.query.buildDocSections.findFirst({
      where: eq(buildDocSections.id, id),
    });

    if (!existingSection) {
      return { success: false, error: 'Section not found' };
    }

    const [updatedSection] = await db.update(buildDocSections)
      .set({
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
        ...(parentSectionId !== undefined && { parentSectionId }), // Include parentSectionId if provided
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(buildDocSections.id, id))
      .returning();

    const buildDocResult = await getBuildDoc(existingSection.buildDocId);
    
    if (buildDocResult.success && buildDocResult.data) {
      revalidatePath(`/server/view/${buildDocResult.data.serverId}/build-docs/${existingSection.buildDocId}`);
    }
    
    return { success: true, data: updatedSection };
  } catch (error) {
    console.error('Error updating build doc section:', error);
    return { success: false, error: 'Failed to update build doc section' };
  }
}

// Delete a build doc section
export async function deleteBuildDocSection(id: number) {
  try {
    const existingSection = await db.query.buildDocSections.findFirst({
      where: eq(buildDocSections.id, id),
    });

    if (!existingSection) {
      return { success: false, error: 'Section not found' };
    }

    await db.delete(buildDocSections).where(eq(buildDocSections.id, id));

    const buildDocResult = await getBuildDoc(existingSection.buildDocId);
    
    if (buildDocResult.success && buildDocResult.data) {
      revalidatePath(`/server/view/${buildDocResult.data.serverId}/build-docs/${existingSection.buildDocId}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting build doc section:', error);
    return { success: false, error: 'Failed to delete build doc section' };
  }
}

// Create a new build doc section template
export async function createBuildDocSectionTemplate(data: { 
  title: string; 
  content?: string; 
  tags?: string[];
  isPublic?: boolean;
  parentTemplateId?: number;
  order?: number;
  userId: string;
}) {
  const { title, content, tags = [], isPublic = true, parentTemplateId = null, order = 0, userId } = data;
  
  try {
    const [newTemplate] = await db.insert(buildDocSectionTemplates)
      .values({
        title,
        content: content || null,
        tags,
        isPublic,
        parentTemplateId: parentTemplateId || null,
        order,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath('/templates/build-docs');
    return { success: true, data: newTemplate };
  } catch (error) {
    console.error('Error creating build doc section template:', error);
    return { success: false, error: 'Failed to create build doc section template' };
  }
}

// Create a template from a section including all its child sections
export async function createTemplateFromSection(data: {
  sectionId: number;
  isPublic?: boolean;
  userId: string;
}) {
  const { sectionId, isPublic = true, userId } = data;
  
  try {
    // Get the section to template
    const section = await db.query.buildDocSections.findFirst({
      where: eq(buildDocSections.id, sectionId),
    });
    
    if (!section) {
      return { success: false, error: 'Section not found' };
    }
    
    // Create the root template
    const rootTemplateResult = await createBuildDocSectionTemplate({
      title: section.title,
      content: section.content || '',
      isPublic,
      userId,
    });
    
    if (!rootTemplateResult.success || !rootTemplateResult.data) {
      return { success: false, error: 'Failed to create root template' };
    }
    
    const rootTemplateId = rootTemplateResult.data.id;
    
    // Find all child sections
    const childSections = await getChildBuildDocSections(sectionId);
    
    // Recursively template all child sections
    await _createTemplatesForChildren(childSections, rootTemplateId, isPublic, userId);
    
    return { success: true, data: rootTemplateResult.data };
  } catch (error) {
    console.error('Error creating template from section:', error);
    return { success: false, error: 'Failed to create template from section' };
  }
}

// Helper function to recursively create templates for child sections
async function _createTemplatesForChildren(
  sections: BuildDocSection[],
  parentTemplateId: number,
  isPublic: boolean,
  userId: string
) {
  for (const section of sections) {
    // Create template for this section
    const templateResult = await createBuildDocSectionTemplate({
      title: section.title,
      content: section.content || '',
      isPublic,
      parentTemplateId,
      order: section.order,
      userId,
    });
    
    if (templateResult.success && templateResult.data) {
      // Get this section's children
      const childSections = await getChildBuildDocSections(section.id);
      
      if (childSections.length > 0) {
        // Recursively create templates for this section's children
        await _createTemplatesForChildren(childSections, templateResult.data.id, isPublic, userId);
      }
    }
  }
}

// Use a template to create a new section
export async function createSectionFromTemplate(data: { 
  buildDocId: number; 
  parentSectionId?: number; 
  templateId: number; 
  userId: string;
}) {
  const { buildDocId, parentSectionId, templateId, userId } = data;
  
  try {
    const template = await db.query.buildDocSectionTemplates.findFirst({
      where: eq(buildDocSectionTemplates.id, templateId),
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Create the root section
    const result = await createBuildDocSection({
      buildDocId,
      parentSectionId,
      title: template.title,
      content: template.content || '',
      userId,
    });

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to create section from template' };
    }

    // Get child templates if any
    const childTemplates = await db.select()
      .from(buildDocSectionTemplates)
      .where(eq(buildDocSectionTemplates.parentTemplateId, templateId))
      .orderBy(buildDocSectionTemplates.order);

    if (childTemplates.length > 0) {
      // Recursively create child sections from child templates
      await _createSectionsFromChildTemplates(childTemplates, buildDocId, result.data.id, userId);
    }

    return result;
  } catch (error) {
    console.error('Error creating section from template:', error);
    return { success: false, error: 'Failed to create section from template' };
  }
}

// Helper function to recursively create sections from child templates
async function _createSectionsFromChildTemplates(
  childTemplates: typeof buildDocSectionTemplates.$inferSelect[],
  buildDocId: number,
  parentSectionId: number,
  userId: string
) {
  for (const childTemplate of childTemplates) {
    // Create section for this child template
    const childSectionResult = await createBuildDocSection({
      buildDocId,
      parentSectionId,
      title: childTemplate.title,
      content: childTemplate.content || '',
      order: childTemplate.order,
      userId,
    });
    
    if (childSectionResult.success && childSectionResult.data) {
      // Get this template's children
      const nestedChildTemplates = await db.select()
        .from(buildDocSectionTemplates)
        .where(eq(buildDocSectionTemplates.parentTemplateId, childTemplate.id))
        .orderBy(buildDocSectionTemplates.order);
      
      if (nestedChildTemplates.length > 0) {
        // Recursively create sections for the child templates
        await _createSectionsFromChildTemplates(
          nestedChildTemplates, 
          buildDocId,
          childSectionResult.data.id,
          userId
        );
      }
    }
  }
}
