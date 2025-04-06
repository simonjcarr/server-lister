// src/middleware.ts
import NextAuth from "next-auth";
// Import your EDGE-COMPATIBLE config only
import authConfig from "@/auth.config";

// Initialize NextAuth using only the Edge config for the middleware
const { auth } = NextAuth(authConfig);

// Use the auth instance derived from Edge config.
// This automatically runs the 'authorized' callback from authConfig.
export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};




// import { NextRequest, NextResponse } from "next/server";

// export default async function middleware(request: NextRequest) {
//   // Get the URL of the requested page
//   const { pathname } = request.nextUrl;

//   // Check if the pathname starts with any of these paths
//   if (
//     pathname.startsWith("/_next") || // Next.js static files
//     pathname.startsWith("/api/auth") || // Auth API routes
//     pathname === "/favicon.ico" // Favicon
//   ) {
//     return NextResponse.next();
//   }

//   // Check for various possible session cookie names used by Next Auth v5
//   const hasSessionCookie =
//     request.cookies.has("next-auth.session-token") ||
//     request.cookies.has("__Secure-next-auth.session-token") ||
//     request.cookies.has("__Host-next-auth.session-token");

//   // If there's no session cookie, redirect to the sign-in page
//   if (!hasSessionCookie) {
//     const signInUrl = new URL("/api/auth/signin", request.url);
//     signInUrl.searchParams.set("callbackUrl", pathname);
//     return NextResponse.redirect(signInUrl);
//   }

//   // User has a session cookie, allow them to access the page
//   return NextResponse.next();
// }

// // Configure which paths the middleware runs on
// export const config = {
//   matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
// };
