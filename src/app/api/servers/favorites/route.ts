import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { eq, and, inArray } from 'drizzle-orm';
import { users_servers, servers } from '@/db/schema';
import { getRequiredUserIdFromSession } from '@/lib/auth';

// Get the user's favorite servers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getRequiredUserIdFromSession(session);

    // Get all favorite servers for the user
    const favoriteServers = await db
      .select({
        id: users_servers.id,
        userId: users_servers.userId,
        serverId: users_servers.serverId,
        createdAt: users_servers.createdAt,
      })
      .from(users_servers)
      .where(eq(users_servers.userId, userId));

    return NextResponse.json(favoriteServers);
  } catch (error) {
    console.error('Error fetching favorite servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite servers' },
      { status: 500 }
    );
  }
}

// Update the user's favorite servers
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getRequiredUserIdFromSession(session);
    const { serverIds } = await req.json();

    if (!Array.isArray(serverIds)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected serverIds array.' },
        { status: 400 }
      );
    }

    // Begin transaction
    await db.transaction(async (tx) => {
      // Delete all current favorites
      await tx
        .delete(users_servers)
        .where(eq(users_servers.userId, userId));

      // Skip if no servers to add
      if (serverIds.length === 0) {
        return;
      }

      // Add new favorites
      const now = new Date();
      const insertValues = serverIds.map(serverId => ({
        userId,
        serverId,
        createdAt: now,
        updatedAt: now
      }));

      await tx.insert(users_servers).values(insertValues);
    });

    return NextResponse.json(
      { message: 'Favorite servers updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating favorite servers:', error);
    return NextResponse.json(
      { error: 'Failed to update favorite servers' },
      { status: 500 }
    );
  }
}
