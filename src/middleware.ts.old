import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Log the requested URL for debugging
  console.log('Middleware request URL:', request.url);
  
  // Add trusted headers for Auth.js
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const requestHeaders = new Headers(request.headers);
    
    // Get the hostname from NEXTAUTH_URL
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (!nextAuthUrl) {
      throw new Error('NEXTAUTH_URL is not defined');
    }
    const url = new URL(nextAuthUrl);
    
    // Add headers that help Auth.js identify the correct host
    requestHeaders.set('x-forwarded-host', url.host);
    requestHeaders.set('x-forwarded-proto', url.protocol.replace(':', ''));
    requestHeaders.set('host', url.host);
    
    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Process all other routes normally
  return NextResponse.next();
}

// Run middleware on auth routes
export const config = {
  matcher: ['/api/auth/:path*'],
};
