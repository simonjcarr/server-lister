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

      console.log('Middleware processing admin route:', path);
      console.log('Token received:', token ? 'Token present' : 'No token');

      // Not authenticated - redirect to login
      if (!token) {
        console.log('Redirecting to login - no authentication token');
        const loginUrl = new URL('/api/auth/signin', req.url);
        loginUrl.searchParams.set('callbackUrl', req.url);
        return NextResponse.redirect(loginUrl);
      }

      // Check for roles property
      if (!token.roles) {
        console.log('Token missing roles property:', token);
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Force cast to array
      const roles = Array.isArray(token.roles) ? token.roles : [token.roles];
      console.log('User roles from token:', roles);

      // Check admin role
      if (!roles.includes('admin')) {
        console.log('Access denied - user lacks admin role');
        return NextResponse.redirect(new URL('/', req.url));
      }

      console.log('Access granted - user has admin role');
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
