'use server'
import { db } from "@/db"
import { certs, CertRequest, servers, users, UpdateCert } from "@/db/schema"
import { auth } from "@/auth"
import { eq } from "drizzle-orm"
import { requireAtLeastOneRole } from "@/lib/role-utils";
//import bullMQ worker
import { jobQueue } from "@/lib/queue";

export async function createCertRequest(cert: CertRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = session?.user.id;
  
  // Make sure we're dealing with plain objects that can be serialized
  const certData = {
    ...cert,
    requestedById: userId,
    status: "Pending" as "Pending" | "Ordered" | "Ready",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Return only a simplified serializable response
  try {
    await db.insert(certs).values(certData);
    await jobQueue.add('notification', 
      { title: "Certificate Request", 
        message: `A new certificate request has been created for ${cert.primaryDomain} by ${session.user.name}.`, 
        roleNames: ["admin", "certs"] 
      });
    return { success: true };
  } catch (error) {
    console.error("Error creating certificate request:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getServerCerts(serverId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  try {
    const results = await db
      .select()
      .from(certs)
      .where(eq(certs.serverId, serverId))
    return results;
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw error;
  }
}

export async function getAllCertificates() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  try {
    const results = await db
      .select({
        id: certs.id,
        status: certs.status,
        primaryDomain: certs.primaryDomain,
        otherDomains: certs.otherDomains,
        server: {
          id: servers.id,
          name: servers.hostname
        },
        requestedBy: {
          id: users.id,
          name: users.name
        }
      })
      .from(certs)
      .leftJoin(servers, eq(certs.serverId, servers.id))
      .leftJoin(users, eq(certs.requestedById, users.id))
    return results;
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw error;
  }
}

export async function getCertificateById(certId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  try {
    const result = await db
      .select({
        id: certs.id,
        status: certs.status,
        primaryDomain: certs.primaryDomain,
        otherDomains: certs.otherDomains,
        requestId: certs.requestId,
        storagePath: certs.storagePath,
        server: {
          id: servers.id,
          hostname: servers.hostname,
          ipv4: servers.ipv4
        },
        requestedBy: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(certs)
      .where(eq(certs.id, certId))
      .leftJoin(servers, eq(certs.serverId, servers.id))
      .leftJoin(users, eq(certs.requestedById, users.id))
    return result[0];
  } catch (error) {
    console.error("Error fetching certificate:", error);
    throw error;
  }
}

export async function updateCertificate(cert: UpdateCert) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // Check if user has at least one of the required roles
  requireAtLeastOneRole(session.user?.roles, ["admin", "certs"]);
  
  // Make sure we're dealing with plain objects that can be serialized
  const certData = {
    ...cert,
    updatedAt: new Date(),
  };
  
  // Return only a simplified serializable response
  try {
    // Add a check to ensure id exists
    if (!certData.id) {
      throw new Error("Certificate ID is required for update");
    }
    
    const result = await db.update(certs).set(certData).where(eq(certs.id, certData.id)).returning();
    await jobQueue.add('notification', 
      { title: "Certificate Request Update", 
        message: `Your certificate request for ${cert.primaryDomain} has been updated by ${session.user.name}.`, 
        userIds: [result[0].requestedById]
      });
    return result;
  } catch (error) {
    console.error("Error updating certificate:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
