// middleware.cypress.ts - Only used during Cypress testing
import { NextResponse } from 'next/server';

// This middleware is ONLY used when CYPRESS_TESTING=true
// It bypasses auth checks to allow Cypress to test authenticated routes
export default function middleware() {
  // Always allow access during Cypress testing
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
