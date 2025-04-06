// cypress.config.js (JWT Strategy)
import { defineConfig } from "cypress";
// Adjust path to your Drizzle setup (still needed to get user ID/roles)
import { db } from "./src/db/index";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
// Import jose for JWT signing
import * as jose from "jose";
import crypto from "crypto"; // Import crypto for generating random UUID

// Ensure NEXTAUTH_SECRET is loaded (using dotenv or similar if needed)
// CRITICAL: Must be the *exact* same secret used by your Next.js app
const secret = process.env.AUTH_SECRET;
const maxAge = 30 * 24 * 60 * 60; // 30 days (match NextAuth config)

if (!secret) {
  throw new Error(
    "NEXTAUTH_SECRET environment variable is not set for Cypress task!"
  );
}

console.log("CYPRESS_SECRET:", secret);
// Encode the secret once (required by jose)
const encodedSecret = new TextEncoder().encode(secret);

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      on("task", {
        // --- NEW TASK ---
        async generateJwt({ userEmail }) {
          if (!userEmail) {
            throw new Error("User email must be provided to generateJwt task");
          }
          if (!secret) {
            // Redundant check, but safe
            throw new Error(
              "NEXTAUTH_SECRET is not available in generateJwt task"
            );
          }

          try {
            // 1. Find user in DB to get ID and roles (similar to your jwt callback)
            console.log(`[Task:generateJwt] Finding user: ${userEmail}`);
            const foundUsers = await db
              .select({
                id: users.id,
                email: users.email,
                name: users.name,
                roles: users.roles, // Assuming roles are stored directly
              })
              .from(users)
              .where(eq(users.email, userEmail))
              .limit(1);

            const user = foundUsers[0];

            if (!user) {
              throw new Error(`Test user with email ${userEmail} not found.`);
            }
            console.log(
              `[Task:generateJwt] Found user ID: ${user.id}, Roles: ${user.roles}`
            );

            // 2. Construct the JWT payload (mimic your jwt callback structure)
            const payload = {
              // Standard claims
              sub: user.id, // User ID goes in 'sub' claim
              jti: crypto.randomUUID(), // Required by Auth.js v5
              iat: Math.floor(Date.now() / 1000), // Issued at timestamp (seconds)
              exp: Math.floor(Date.now() / 1000) + maxAge, // Expiration timestamp (seconds)
              // Custom claims (match what your jwt callback adds)
              name: user.name,
              email: user.email,
              roles: user.roles || [], // Add roles from DB
              // Add any other fields your jwt callback or session needs
            };
            console.log("[Task:generateJwt] JWT Payload:", payload);

            // 3. Sign the JWT
            const jwt = await new jose.SignJWT(payload)
              .setProtectedHeader({ alg: "HS256" }) // Algorithm used by NextAuth default
              .setIssuedAt(payload.iat)
              .setExpirationTime(payload.exp)
              .setSubject(payload.sub)
              .sign(encodedSecret); // Sign with the encoded secret

            console.log(
              `[Task:generateJwt] Generated JWT (first 15 chars): ${jwt.substring(
                0,
                15
              )}...`
            );

            // 4. Return the signed JWT string and expiry for the cookie
            return {
              signedJwt: jwt,
              // Expiry date object for the cookie setting (matches JWT exp)
              expires: new Date(payload.exp * 1000).toISOString(),
            };
          } catch (error) {
            console.error("Error in generateJwt task:", error);
            return null;
          }
        },
        // --- Keep DB disconnect logic if needed ---
      });
      // on('after:run', async () => { await db.$disconnect(); }); // If using Prisma
      return config;
    },
    env: {
      // Still use this to determine cookie name (__Secure- prefix or not)
      NEXTAUTH_COOKIE_NAME:
        process.env.NODE_ENV === "production" ||
        process.env.USE_SECURE_COOKIES === "true"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
    },
  },
});
