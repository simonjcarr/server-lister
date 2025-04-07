import { NextResponse } from "next/server";

export const runtime = "edge"; // <--- Force Edge Runtime!

export async function GET() {
  const secret = process.env.AUTH_SECRET;
  const url = process.env.NEXTAUTH_URL;

  return NextResponse.json({
    edgeAuthSecretLoaded: !!secret,
    // Attempt hint again, might work in edge
    edgeAuthSecretHint: secret
      ? `<span class="math-inline">\{secret\.substring\(0, 3\)\}\.\.\.</span>{secret.slice(-3)}`
      : null,
    edgeNextAuthUrl: url,
  });
}
