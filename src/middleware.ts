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
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
