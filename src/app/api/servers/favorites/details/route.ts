import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { users_servers, servers } from '@/db/schema';
import { getRequiredUserIdFromSession } from '@/lib/auth';

// Get the user's favorite servers with details
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getRequiredUserIdFromSession(session);

    // Get all favorite servers for the user with detailed server information
    const favoriteServers = await db
      .select({
        userServer: {
          id: users_servers.id,
          userId: users_servers.userId,
          serverId: users_servers.serverId,
          createdAt: users_servers.createdAt,
        },
        server: {
          id: servers.id,
          hostname: servers.hostname,
          ipv4: servers.ipv4,
          description: servers.description,
        }
      })
      .from(users_servers)
      .innerJoin(servers, eq(users_servers.serverId, servers.id))
      .where(eq(users_servers.userId, userId))
      .orderBy(servers.hostname);

    // Format the response
    const formattedResponse = favoriteServers.map(item => ({
      ...item.userServer,
      server: item.server
    }));

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching favorite servers details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite server details' },
      { status: 500 }
    );
  }
}
