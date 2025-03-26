/**
 * Helper functions for Next-Auth session management in tests
 */

/**
 * Creates a test session payload
 * Note: This is just a helper function, not a Nightwatch command
 */
function createTestSessionPayload(userId = 'test-user-id', roles = ['user']) {
  // Create a session payload
  return {
    user: {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      roles: roles
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
}

/**
 * Helper to manage test users in the database
 */
async function ensureTestUserExists(db) {
  // This would programmatically create a test user in your database
  // if it doesn't exist. Would run as part of your test setup.
  
  const testUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    roles: ['user', 'admin'],
    // Other required fields
  };
  
  // Implementation depends on your database setup
  // Example with direct DB insertion:
  // await db.insert(users).values(testUser).onConflictDoNothing();
  
  return testUser;
}

module.exports = {
  createTestSessionPayload,
  ensureTestUserExists
};