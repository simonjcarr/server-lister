import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { servers, locations, os as operatingSystems } from '@/db/schema';

// Get all servers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all servers with related data
    const allServers = await db.select({
      id: servers.id,
      hostname: servers.hostname,
      ipv4: servers.ipv4,
      ipv6: servers.ipv6,
      description: servers.description,
      projectId: servers.projectId,
      business: servers.business,
      osId: servers.osId,
      locationId: servers.locationId,
      createdAt: servers.createdAt,
    })
    .from(servers)
    .orderBy(servers.hostname);

    return NextResponse.json(allServers);
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}
