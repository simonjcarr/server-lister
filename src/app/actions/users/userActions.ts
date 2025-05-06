"use server";

import db from "@/db/getdb";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetches all users from the database.
 *
 * @returns {Promise<Array<{ id: string, email: string, roles: string[] }>>}
 *          A promise that resolves to an array of user objects.
 */
export async function getAllUsers() {
  const allUsers = await db.select().from(users).orderBy(users.email);
  if(!allUsers) {
    console.log("Error fetching users from getAllUsers()")
    return []
  }
  return allUsers;
}

/**
 * Fetches a user by their ID from the database.
 *
 * @param {string} userId The ID of the user to fetch.
 * @returns {Promise<{ id: string, email: string, roles: string[] }>}
 *          A promise that resolves to a user object.
 */
export async function getUserById(userId: string) {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId));
    return user;
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user",
    };
  }
}

/**
 * Updates the roles of a user in the database.
 *
 * @param {string} userId The ID of the user to update.
 * @param {string[]} roles The new roles of the user.
 * @returns {Promise<{ success: boolean, error?: string }>}
 *          A promise that resolves to a response object indicating success or failure.
 */
export async function updateUserRoles(userId: string, roles: string[]) {
  try {
    await db.update(users).set({ roles }).where(eq(users.id, userId));
    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error updating user roles:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update user roles",
    };
  }
}
