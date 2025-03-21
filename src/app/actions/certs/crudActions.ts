'use server'
import { db } from "@/db"
import { certs, CertRequest } from "@/db/schema"
import { auth } from "@/auth"
import { eq } from "drizzle-orm"

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
    // Only return a simple success object, not the database result
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
