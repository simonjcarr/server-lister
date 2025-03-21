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
  return db.insert(certs).values({
    ...cert,
    requestedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}