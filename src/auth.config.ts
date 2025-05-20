import { NextAuthConfig } from "next-auth";

const authConfig: NextAuthConfig = {
  // trustHost should likely be true in dev for localhost testing
  trustHost: true,

  providers: [
    {
      id: "dex",
      name: "Login with Dex",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER_URL,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      authorization: {
        url: `${process.env.PUBLIC_OIDC_ISSUER_URL}/auth`,
        params: {
          scope: "openid profile email",
          // Don't set the issuer in params, as it overrides the correct URL
        },
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Add JWT callback to ensure roles from OIDC provider or profile are preserved in the token
    jwt({ token, user, profile }) {
      if (profile) {
        // Check for roles information in the OIDC profile or ID token claims
        if (profile.roles) token.roles = profile.roles;
        if (profile.groups) token.roles = profile.groups; // Some providers use "groups" instead
      }

      // If user object has roles (from adapter/DB), include them in token
      if (user && user.roles) {
        token.roles = user.roles;
      }

      return token;
    },

    // Add session callback to copy roles from token to user object
    session({ session, token }) {
      if (token && session.user) {
        // Ensure user object exists
        session.user = session.user || {};

        // Copy roles from token to session.user
        if (token.roles) {
          session.user.roles = Array.isArray(token.roles)
            ? token.roles
            : [token.roles];
        } else {
          session.user.roles = []; // Default empty array if no roles
        }
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Only apply authorization check on admin routes
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        // Check if user has admin role
        const roles = (auth.user.roles as string[]) || [];
        return roles.includes("admin");
      }

      // Allow all other routes
      return true;
    },
  },
  // Remove custom pages configuration to use default Auth.js pages
  debug: false,
};

export default authConfig;
