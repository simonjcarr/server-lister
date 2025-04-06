// Cypress hooks to intercept Auth.js session requests and return a mock authenticated session

// This function creates an interception before each test that forces Auth.js to see an authenticated session
export function setupAuthInterception() {
  // Run this before each test
  beforeEach(() => {
    // Intercept the Auth.js session endpoint and return an authenticated session
    cy.intercept('/api/auth/session', (req) => {
      req.reply({
        body: {
          user: {
            name: 'Admin User',
            email: 'admin@example.com',
            roles: ['admin', 'cert-manager', 'user-manager'],
            id: 'admin-user-id-1234',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
    
    // Also intercept the CSRF endpoint if needed
    cy.intercept('/api/auth/csrf', (req) => {
      req.reply({
        body: {
          csrfToken: 'mock-csrf-token',
        },
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });
}
