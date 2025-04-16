'use server'
import db from "@/db/getdb";
import type { ScanResults } from "@/db/schema";
import { servers, serverScans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function insertScan(data: ScanResults) {
  data.host.memoryGB = Math.round(Number(data.host.memoryGB))
  data.host.cores = Number(data.host.cores)
  try {
    let server = await db.select().from(servers).where(eq(servers.hostname, data.host.hostname))
    if (!server || server.length === 0) {
      server = await db.insert(servers).values({
        hostname: data.host.hostname,
        description: 'Auto created by Server Scan',
        ram: data.host.memoryGB,
        cores: data.host.cores,
        ipv4: data.host.ipv4,
        ipv6: data.host.ipv6,
        onboarded: false, // New server, not yet onboarded
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()
    } else {
      await updateServerWithScan(data)
    }
    await db.delete(serverScans).where(eq(serverScans.serverId, server[0].id))
    return await db.insert(serverScans).values({
      scanResults: data,
      serverId: server[0].id,
      scanDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error(error)
    throw new Error("Failed to create scan");
  }
}

export async function updateServerWithScan(data: ScanResults) {
  try {
    const server = await db.select().from(servers).where(eq(servers.hostname, data.host.hostname))
    if (!server || server.length === 0) {
      throw new Error("Server not found");
    }
    return await db.update(servers).set({
      ipv4: data.host.ipv4,
      ipv6: data.host.ipv6,
      cores: data.host.cores,
      ram: data.host.memoryGB,
      updatedAt: new Date(),
      macAddress: data.host.macAddress,
    }).where(eq(servers.id, server[0].id))
  } catch (error) {
    console.error(error)
    throw new Error("Failed to update server");
  }
}

export async function getServerStorage(serverId: number) {
  try {
    const scanResults = await db.select().from(serverScans).where(eq(serverScans.serverId, serverId)).limit(1)
    if (!scanResults || scanResults.length === 0) {
      throw new Error("Server not found");
    }
    return scanResults[0].scanResults.host.storage
  } catch (error) {
    console.error(error)
    throw new Error("Failed to get server storage");
  }
}

export async function getServerSoftware(serverId: number) {
  try {
    const scanResults = await db.select().from(serverScans).where(eq(serverScans.serverId, serverId)).limit(1)
    if (!scanResults || scanResults.length === 0) {
      throw new Error("Server not found");
    }
    return scanResults[0].scanResults.software
  } catch (error) {
    console.error(error)
    throw new Error("Failed to get server software");
  }
}

export async function getServerServices(serverId: number) {
  try {
    const scanResults = await db.select().from(serverScans).where(eq(serverScans.serverId, serverId)).limit(1)
    if (!scanResults || scanResults.length === 0) {
      throw new Error("Server not found");
    }
    return scanResults[0].scanResults.services
  } catch (error) {
    console.error(error)
    throw new Error("Failed to get server services");
  }
}

export async function getServerUsers(serverId: number) {
  try {
    const scanResults = await db.select().from(serverScans).where(eq(serverScans.serverId, serverId)).limit(1)
    if (!scanResults || scanResults.length === 0) {
      throw new Error("Server not found");
    }
    return scanResults[0].scanResults.host.users
  } catch (error) {
    console.error(error)
    throw new Error("Failed to get server users");
  }
}

export async function getServerOS(serverId: number) {
  try {
    const scanResults = await db.select().from(serverScans).where(eq(serverScans.serverId, serverId)).limit(1)
    if (!scanResults || scanResults.length === 0) {
      throw new Error("Server not found");
    }
    return scanResults[0].scanResults.os
  } catch (error) {
    console.error(error)
    throw new Error("Failed to get server OS");
  }
}
  
