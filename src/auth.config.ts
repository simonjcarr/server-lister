import { NextAuthConfig } from "next-auth";

const authConfig: NextAuthConfig = {
  // trustHost should likely be true in dev for localhost testing
  trustHost: true,
  // REMOVE the basePath line if your API routes are at /api/auth/...
  // basePath: process.env.NEXTAUTH_URL, // <--- REMOVE THIS

  providers: [
    // ... your dex provider ...
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // ... your authorized callback ... (keep this)
  },
  pages: {
    signIn: "/api/auth/signin", // This is correct
    error: "/api/auth/error", // This is correct
  },
  debug: true,
};

export default authConfig;












// import { NextAuthConfig } from "next-auth";

// // Edge-compatible configuration (no database imports)
// const authConfig: NextAuthConfig = {
//   trustHost: process.env.NODE_ENV === 'development' ? false : true,
//   // Explicitly define the URL to prevent protocol switching
//   basePath: process.env.NEXTAUTH_URL,
//   providers: [
//     {
//       id: "dex",
//       name: "Login with Dex",
//       type: "oidc",
//       issuer: process.env.OIDC_ISSUER_URL,
//       clientId: process.env.AUTH_CLIENT_ID,
//       clientSecret: process.env.AUTH_CLIENT_SECRET,
//     },
//   ],
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     authorized({ auth, request: { nextUrl } }) {
//       const isLoggedIn = !!auth?.user;

//       // Only apply authorization check on admin routes
//       const isAdminRoute = nextUrl.pathname.startsWith('/admin');

//       if (isAdminRoute) {
//         if (!isLoggedIn) return false;

//         // Check if user has admin role
//         const roles = auth.user.roles as string[] || [];
//         return roles.includes('admin');
//       }

//       // Allow all other routes
//       return true;
//     },
//   },
//   pages: {
//     signIn: '/api/auth/signin',
//     error: '/api/auth/error',
//   },
// };

// export default authConfig;
