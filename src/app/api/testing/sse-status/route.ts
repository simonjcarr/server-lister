// This is a diagnostic endpoint used for debugging SSE connections
// It's currently disabled for production use
// To re-enable, uncomment the implementation

import { NextRequest, NextResponse } from 'next/server';

// Placeholder route handler that returns 404
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
