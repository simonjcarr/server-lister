import { Session } from 'next-auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';

export async function getRequiredUserIdFromSession(session: Session | null): Promise<string> {
  if (!session?.user?.email) {
    throw new Error('User not authenticated');
  }

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error('User not found');
  }

  return userResult[0].id;
}
