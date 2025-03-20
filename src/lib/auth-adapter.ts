import { Adapter } from "next-auth/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import * as schema from "../db/schema";

// Create a custom adapter that extends the functionality of DrizzleAdapter
export function CustomDrizzleAdapter(db: any): Adapter {
  // Get the original adapter methods from DrizzleAdapter
  const originalAdapter = DrizzleAdapter(db);
  
  return {
    ...originalAdapter,
    createUser: async (user) => {
      // Add timestamp fields to the user data
      const now = new Date();
      const userData = {
        ...user,
        createdAt: now,
        updatedAt: now,
      };

      // Insert the user with timestamps directly using drizzle
      const [createdUser] = await db.insert(schema.users).values(userData).returning();
      return createdUser;
    },
    // Also override the linkAccount to make it consistent
    linkAccount: async (account) => {
      // Use the original adapter's linkAccount method
      if (originalAdapter.linkAccount) {
        return originalAdapter.linkAccount(account);
      }
      
      // Fallback implementation if needed
      const [createdAccount] = await db
        .insert(schema.accounts)
        .values(account)
        .returning();
      return createdAccount;
    }
  };
}
