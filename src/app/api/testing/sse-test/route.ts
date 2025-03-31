// This is a diagnostic endpoint used for testing SSE notifications
// It's currently disabled for production use

import { NextRequest, NextResponse } from 'next/server';

// Placeholder route handler that returns 404
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
