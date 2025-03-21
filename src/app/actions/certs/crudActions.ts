'use server'
import { db } from "@/db"
import { certs, CertRequest } from "@/db/schema"
import { auth } from "@/auth"

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