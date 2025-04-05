import { join } from 'path';
import fs from 'fs';
import { db } from '../../../src/db';
import { users } from '../../../src/db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * Seeds a test user in the database
 * @param userFixture The name of the user fixture file (without extension)
 * @returns The seeded user data
 */
export async function seedTestUser(userFixture: string) {
  // Read user fixture
  const fixtureFile = join(process.cwd(), 'cypress', 'fixtures', 'users', `${userFixture}.json`);
  const userData = JSON.parse(fs.readFileSync(fixtureFile, 'utf-8'));
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.id, userData.id));
  
  if (existingUser.length > 0) {
    // Update existing user if needed
    await db.update(users)
      .set({
        name: userData.name,
        email: userData.email,
        roles: userData.roles,
        image: userData.image,
        updatedAt: new Date()
      })
      .where(eq(users.id, userData.id));
      
    return userData;
  }
  
  // Insert new user
  await db.insert(users).values({
    id: userData.id,
    name: userData.name,
    email: userData.email,
    emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
    image: userData.image,
    roles: userData.roles,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return userData;
}

/**
 * Removes a test user from the database
 * @param userId The ID of the user to remove
 */
export async function removeTestUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
