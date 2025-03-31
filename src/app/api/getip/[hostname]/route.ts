import { default as dns } from "node:dns";
import { auth } from "@/auth";

export async function GET(request: Request, { params }: { params: Promise<{ hostname: string }> }) {
  const session = await auth();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const { hostname } = await params;
  try {
    const result = await dns.promises.lookup(hostname);
    return new Response(JSON.stringify({ ip: result.address }));
  } catch (error) {
    console.error("Error resolving hostname:", error);
    return new Response(JSON.stringify({ error: "Error resolving hostname" }), { status: 500 });
  }
}