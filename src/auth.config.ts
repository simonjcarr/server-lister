import { NextAuthConfig } from "next-auth";

// Edge-compatible configuration (no database imports)
const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "dex",
      name: "Login with Dex",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER_URL,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // Only apply authorization check on admin routes
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      
      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        
        // Check if user has admin role
        const roles = auth.user.roles as string[] || [];
        return roles.includes('admin');
      }
      
      // Allow all other routes
      return true;
    },
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
};

export default authConfig;
