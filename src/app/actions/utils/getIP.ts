'use server'
// Use the src/app/api/getip/[hostname]/route.ts as a template to create this server action
import { default as dns } from "node:dns";
import { auth } from "@/auth";

export async function getIP(hostname: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  try {
    const result = await dns.promises.lookup(hostname);
    return { ip: result.address }
  } catch (error) {
    return { ip: null }
  }
}