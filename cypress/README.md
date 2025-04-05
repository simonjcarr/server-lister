# Cypress Testing with NextAuth v5 Authentication Mocking

This directory contains Cypress test configuration with support for mocking NextAuth v5 authentication.

## Key Features

- Mock user sessions for testing without real authentication
- Seed test users in the database for features requiring user data
- Intercept auth-related requests to simulate authenticated sessions
- Different user profiles with various roles for testing role-based features

## User Fixtures

Test user fixtures are stored in `cypress/fixtures/users/`:

- `admin.json` - Admin user with multiple roles
- `cert-manager.json` - User with cert-manager role
- `basic-user.json` - User with basic permissions

You can add more user fixtures as needed.

## How to Use

### Mock a User Session

To mock a user session in your tests:

```typescript
// Mock session for the admin user
cy.mockUserSession('admin');

// Visit a protected page
cy.visit('/dashboard');
```

This will:
1. Intercept all NextAuth session-related API calls
2. Set the necessary cookies to bypass middleware authentication
3. Return consistent user data to both client and server components

### Seed Test Users in the Database

For features that require database queries involving user data:

```typescript
// Seed the admin user in the database
cy.seedTestUser('admin');

// Clean up the user after the test
cy.cleanupTestUser('admin-user-id-1234');
```

Or use the before/after hooks:

```typescript
beforeEach(() => {
  cy.seedTestUser('admin');
});

afterEach(() => {
  const userData = Cypress.env('seededTestUser');
  if (userData && userData.id) {
    cy.cleanupTestUser(userData.id);
  }
});
```

## Example Tests

See `cypress/e2e/auth.cy.ts` for example tests demonstrating session mocking.

## Implementation Details

- Session mocking is implemented in `cypress/support/commands.ts`
- Database operations are defined in `cypress/support/db-seed/users.ts`
- Configuration for Cypress tasks is in `cypress.config.ts`
