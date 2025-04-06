/**
 * Authentication utilities for Cypress tests with Auth.js
 */
import jwt from 'jsonwebtoken';

/**
 * Creates a session token for testing that matches Auth.js v5 format
 */
export function createAuthToken(userId: string, email: string, name: string, roles: string[]) {
  // Create a token that matches what Auth.js expects
  const token = jwt.sign(
    {
      sub: userId,
      email,
      name,
      roles,
      jti: crypto.randomUUID(), // Required by Auth.js v5
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    },
    process.env.AUTH_SECRET || '',
    { algorithm: 'HS256' }
  );

  return token;
}
