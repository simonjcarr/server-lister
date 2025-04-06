// src/auth.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config"; // Import edge config
import { db } from "./db"; // If needed for callbacks/adapter
import { CustomDrizzleAdapter } from "./lib/auth-adapter"; // If using adapter
import { eq } from "drizzle-orm"; // If needed for callbacks
import { users } from "./db/schema"; // If needed for callbacks

export const { handlers, signIn, signOut, auth } = NextAuth({
  // --- SPREAD THE BASE CONFIG FIRST ---
  ...authConfig,

  // --- ADD/OVERRIDE NODE.JS SPECIFIC OPTIONS BELOW ---
  adapter: CustomDrizzleAdapter(db),
  callbacks: {
    ...authConfig.callbacks, // Spread base callbacks (like 'authorized')

    // Your JWT callback (Node.js specific - uses DB)
    async jwt({ token, user, trigger, session }) {
      console.log("[JWT Callback] Trigger:", trigger, "User:", user); // Add Log
      // Add roles to the token when it's first created (only if user exists)
      if (user?.id) {
        try {
          const [dbUser] = await db
            .select({ roles: users.roles }) // Select only necessary field
            .from(users)
            .where(eq(users.id, user.id));
          if (dbUser) {
            token.roles = (dbUser.roles as string[]) || [];
          }
          console.log("[JWT Callback] Roles added from DB:", token.roles);
        } catch (dbError) {
          console.error("[JWT Callback] DB Error:", dbError);
          // Decide how to handle DB error - maybe don't add roles?
          token.roles = [];
        }
      }

      // For session updates (less relevant for API reads)
      if (trigger === "update" && session?.user) {
        if (session.user.roles) {
          token.roles = session.user.roles;
        }
      }
      console.log("[JWT Callback] Returning Token:", token);
      return token;
    },

    // Your Session callback (Node.js specific - uses token)
    async session({ session, token }) {
      console.log("[Session Callback] Input Token:", token); // Add Log
      console.log("[Session Callback] Input Session:", session);
      // Ensure user object exists before assigning
      session.user = session.user ?? {};
      // Assign properties from token if it exists
      if (token) {
        if (token.sub) session.user.id = token.sub;
        if (token.roles) session.user.roles = token.roles as string[];
        if (token.name) session.user.name = token.name; // Ensure name is passed
        if (token.email) session.user.email = token.email; // Ensure email is passed
      }
      // Add your custom methods if you had them before
      // const customSession = { /* ... */ };
      // return { ...session, ...customSession };
      console.log("[Session Callback] Output Session:", session);
      return session; // Return the modified session
    },
  },
  // No need to repeat: providers, pages, session strategy, debug, trustHost
  // They are inherited from authConfig
});
