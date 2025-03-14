'use server';

import { db } from "@/db";
import { InsertServer, SelectServer, business, locations, os, projects, servers } from "@/db/schema";
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { SQLWrapper } from "drizzle-orm/sql";

export async function addServer(data: InsertServer) {
  try {
    console.log(data)
    await db.insert(servers).values({
      ...data,
      // Convert empty strings to null for ipv4 and ipv6
      ipv4: data.ipv4 === "" ? null : data.ipv4,
      ipv6: data.ipv6 === "" ? null : data.ipv6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding server:", error);
    return { success: false };
  }
}

export type ServerFilter = {
  businessId?: number;
  projectId?: number;
  osId?: number;
  locationId?: number;
  search?: string;
};

// All possible sort fields
export type ServerSort = {
  // Direct fields from SelectServer
  field: keyof SelectServer | 
         // Display fields for related data
         'businessName' | 'projectName' | 'osName' | 'locationName';
  direction: 'asc' | 'desc';
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export async function getServerById(serverId: number) {
  try {
    const server = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
    return server[0]
  } catch (error) {
    console.error("Error getting server:", error);
    return null;
  }
}

export async function getServers(
  filters: ServerFilter = {},
  sort: ServerSort = { field: 'hostname', direction: 'asc' },
  pagination: PaginationParams = { page: 1, pageSize: 10 }
) {
  try {
    console.log('Sort received:', sort);
    const whereConditions = [];
    
    if (filters.businessId !== undefined) {
      whereConditions.push(eq(servers.business, filters.businessId));
    }
    
    if (filters.projectId !== undefined) {
      whereConditions.push(eq(servers.projectId, filters.projectId));
    }
    
    if (filters.osId !== undefined) {
      whereConditions.push(eq(servers.osId, filters.osId));
    }
    
    if (filters.locationId !== undefined) {
      whereConditions.push(eq(servers.locationId, filters.locationId));
    }
    
    if (filters.search) {
      whereConditions.push(
        or(
          ilike(servers.hostname, `%${filters.search}%`),
          ilike(servers.description || '', `%${filters.search}%`),
          ilike(servers.ipv4 || '', `%${filters.search}%`),
          ilike(servers.ipv6 || '', `%${filters.search}%`)
        )
      );
    }
    
    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions) 
      : undefined;
    
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(servers)
      .where(whereClause);
      
    const totalCount = Number(totalCountResult[0].count);

    // Handle sorting - determine sort column
    let sortColumn: SQLWrapper;
    
    // Map field name to the appropriate column
    switch(sort.field) {
      // Direct server fields
      case 'hostname': sortColumn = servers.hostname; break;
      case 'ipv4': sortColumn = servers.ipv4; break;
      case 'ipv6': sortColumn = servers.ipv6; break;
      case 'description': sortColumn = servers.description; break;
      case 'docLink': sortColumn = servers.docLink; break;
      case 'itar': sortColumn = servers.itar; break;
      case 'secureServer': sortColumn = servers.secureServer; break;
      
      // Foreign key fields
      case 'projectId': sortColumn = servers.projectId; break;
      case 'business': sortColumn = servers.business; break;
      case 'osId': sortColumn = servers.osId; break;
      case 'locationId': sortColumn = servers.locationId; break;
      
      // Related display fields
      case 'businessName': sortColumn = business.name; break;
      case 'projectName': sortColumn = projects.name; break;
      case 'osName': sortColumn = os.name; break;
      case 'locationName': sortColumn = locations.name; break;
      
      // Default
      default: 
        console.log('Unknown sort field, defaulting to hostname:', sort.field);
        sortColumn = servers.hostname; 
        break;
    }
    
    // Apply ordering based on direction
    const orderBy = sort.direction === 'asc' ? asc(sortColumn) : desc(sortColumn);
    
    // Query with joins to get related data and apply ordering
    const serverData = await db
      .select({
        id: servers.id,
        hostname: servers.hostname,
        ipv4: servers.ipv4,
        ipv6: servers.ipv6,
        description: servers.description,
        docLink: servers.docLink,
        itar: servers.itar,
        secureServer: servers.secureServer,
        projectId: servers.projectId,
        projectName: projects.name,
        businessId: servers.business,
        businessName: business.name,
        osId: servers.osId,
        osName: os.name,
        locationId: servers.locationId,
        locationName: locations.name,
        createdAt: servers.createdAt,
        updatedAt: servers.updatedAt,
      })
      .from(servers)
      .leftJoin(projects, eq(servers.projectId, projects.id))
      .leftJoin(business, eq(servers.business, business.id))
      .leftJoin(os, eq(servers.osId, os.id))
      .leftJoin(locations, eq(servers.locationId, locations.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);
    
    return {
      data: serverData,
      pagination: {
        total: totalCount,
        current: page,
        pageSize,
      },
    };
  } catch (error) {
    console.error("Error getting servers:", error);
    return {
      data: [],
      pagination: {
        total: 0,
        current: pagination.page,
        pageSize: pagination.pageSize,
      },
    };
  }
}

export async function getBusinessOptions() {
  try {
    return await db.select().from(business).orderBy(business.name);
  } catch (error) {
    console.error("Error getting business options:", error);
    return [];
  }
}

export async function getProjectOptions() {
  try {
    return await db.select().from(projects).orderBy(projects.name);
  } catch (error) {
    console.error("Error getting project options:", error);
    return [];
  }
}

export async function getOSOptions() {
  try {
    return await db.select().from(os).orderBy(os.name);
  } catch (error) {
    console.error("Error getting OS options:", error);
    return [];
  }
}

export async function getLocationOptions() {
  try {
    return await db.select().from(locations).orderBy(locations.name);
  } catch (error) {
    console.error("Error getting location options:", error);
    return [];
  }
}