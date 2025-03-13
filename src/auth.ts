import NextAuth from "next-auth";
import { db } from "./db";
import { CustomDrizzleAdapter } from "./lib/auth-adapter";
import { eq } from "drizzle-orm";
import { users } from "./db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomDrizzleAdapter(db),
  providers: [
    {
      id: "dex", // signIn("my-provider") and will be part of the callback URL
      name: "Login with Dex", // optional, used on the default login page as the button text.
      type: "oidc", // or "oauth" for OAuth 2 providers
      issuer: process.env.OIDC_ISSUER_URL, // to infer the .well-known/openid-configuration URL
      clientId: process.env.AUTH_CLIENT_ID, // from the provider's dashboard
      clientSecret: process.env.AUTH_CLIENT_SECRET, // from the provider's dashboard
    },
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user.id) {
        // Query the database directly using the users table
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));
        
        // Add the roles field to the session user object
        if (dbUser) {
          session.user.roles = dbUser.roles as any[] || [];
        } else {
          session.user.roles = [];
        }
      }
      return session;
    },
  },
});
