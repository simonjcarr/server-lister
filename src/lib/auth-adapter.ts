import { Adapter, AdapterUser } from "next-auth/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import * as schema from "../db/schema";

// Create a custom adapter that extends the functionality of DrizzleAdapter
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function CustomDrizzleAdapter(db: PostgresJsDatabase<typeof schema> | NodePgDatabase<typeof schema>): Adapter {
  // Get the original adapter methods from DrizzleAdapter
  const originalAdapter = DrizzleAdapter(db);
  
  // Define our user type that matches what's returned from the database
  type DbUser = {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    roles?: unknown;
    createdAt?: Date;
    updatedAt?: Date;
  };

  // Helper function to ensure user conforms to AdapterUser interface
  const ensureValidUser = (user: DbUser | AdapterUser | null): AdapterUser | null => {
    if (!user) return null;
    return {
      ...user,
      email: user.email || '',  // Ensure email is never null
    } as AdapterUser;
  };
  
  return {
    ...originalAdapter,
    createUser: async (user) => {
      // Add timestamp fields to the user data
      const now = new Date();
      const userData = {
        ...user,
        email: user.email || '', // Ensure email is never null
        createdAt: now,
        updatedAt: now,
      };

      // Insert the user with timestamps directly using drizzle
      const [createdUser] = await db.insert(schema.users).values(userData).returning();
      
      // We ensure a valid user is returned, and it will never be null here
      const validUser = ensureValidUser(createdUser);
      if (!validUser) {
        throw new Error('Failed to create user');
      }
      return validUser;
    },
    // Implement linkAccount according to the correct return type
    linkAccount: async (account) => {
      // Use the original adapter's linkAccount method
      if (originalAdapter.linkAccount) {
        await originalAdapter.linkAccount(account);
        return;
      }
      
      // Fallback implementation if needed
      await db
        .insert(schema.accounts)
        .values(account);
      return;
    },
    
    // Override methods that return user data to ensure they comply with AdapterUser
    getUser: async (id) => {
      if (originalAdapter.getUser) {
        const user = await originalAdapter.getUser(id);
        return ensureValidUser(user);
      }
      return null;
    },
    
    getUserByEmail: async (email) => {
      if (originalAdapter.getUserByEmail) {
        const user = await originalAdapter.getUserByEmail(email);
        return ensureValidUser(user);
      }
      return null;
    },
    
    getUserByAccount: async (providerAccountId) => {
      if (originalAdapter.getUserByAccount) {
        const user = await originalAdapter.getUserByAccount(providerAccountId);
        return ensureValidUser(user);
      }
      return null;
    },
    
    updateUser: async (user) => {
      if (originalAdapter.updateUser) {
        const updatedUser = await originalAdapter.updateUser(user);
        const validUser = ensureValidUser(updatedUser);
        if (!validUser) {
          throw new Error('Failed to update user');
        }
        return validUser;
      }
      throw new Error('updateUser not implemented');
    },
    
    // Ensure session and user returns valid user
    getSessionAndUser: async (sessionToken) => {
      if (originalAdapter.getSessionAndUser) {
        const result = await originalAdapter.getSessionAndUser(sessionToken);
        if (!result) return null;
        
        const validUser = ensureValidUser(result.user);
        if (!validUser) {
          // If we can't validate the user, return null for the whole result
          return null;
        }
        
        return {
          session: result.session,
          user: validUser, // This is never null at this point
        };
      }
      return null;
    }
  };
}
