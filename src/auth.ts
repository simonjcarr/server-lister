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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Add roles to the token when it's first created
      if (user?.id) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));
        
        if (dbUser) {
          token.roles = dbUser.roles as string[] || [];
        }
      }
      
      // For session updates
      if (trigger === "update" && session?.user) {
        // Allow updating user roles via session update
        if (session.user.roles) {
          token.roles = session.user.roles;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      
      if (session.user) {
        // Add the roles from the token to the session
        session.user.roles = token.roles as string[] || [];
      }
      
      return session;
    },
  },
  debug: true,
});
