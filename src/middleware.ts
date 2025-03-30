import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Get the pathname
  const path = req.nextUrl.pathname;

  // Ensure the middleware only runs on admin routes
  if (path.startsWith('/admin')) {
    try {
      // Get the token (with detailed error handling)
      const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
      });

      // Not authenticated - redirect to login
      if (!token) {
        const loginUrl = new URL('/api/auth/signin', req.url);
        loginUrl.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(loginUrl);
      }

      // Check for roles property
      if (!token.roles) {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Force cast to array
      const roles = Array.isArray(token.roles) ? token.roles : [token.roles];

      // Check admin role
      if (!roles.includes('admin')) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Be explicit about admin routes
    '/admin',
    '/admin/:path*',
  ],
};
