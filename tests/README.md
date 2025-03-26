# End-to-End Testing with Nightwatch.js

This directory contains end-to-end tests for the application using Nightwatch.js. The tests are designed to handle authentication through Dex and LDAP.

## Test Structure

- `tests/e2e/`: Contains all end-to-end test files
  - `auth-flow.test.js`: Tests the authentication flow (redirects to login)
  - `login-flow.test.js`: Tests the full login process via Dex LDAP
  - `protected-routes.test.js`: Tests access to protected routes
  - `data-operations.test.js`: Basic data operation tests
  - `database-write.test.js`: Tests operations that write to the database
  - `public-routes.test.js`: Tests access to public routes
  - `login-page.test.js`: Diagnostic test to analyze the login page structure

- `tests/e2e/commands/`: Custom Nightwatch commands
  - `login.js`: Handles full UI authentication flow through Dex LDAP
  - `sessionLogin.js`: Uses cookies to bypass UI login (faster for multiple tests)

- `tests/e2e/helpers/`: Helper functions for testing
  - `session.js`: Utilities for managing test sessions and users

## Authentication Approaches

The tests use two complementary approaches to authentication:

1. **UI Login Flow** (`login.js` command)
   - Simulates a real user logging in via the UI
   - Navigates through all redirects and form submissions
   - Use this to verify the authentication process works correctly
   - Now properly handles the login page with button clicks based on discovered selectors

2. **Cookie-Based Authentication** (`sessionLogin.js` command)
   - Sets cookies to simulate an authenticated session
   - Much faster than going through the UI login flow
   - Use this for most tests to improve execution speed

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in visual mode (without headless browser)
npm run test:e2e:visual

# Run specific test groups
npm run test:e2e:auth        # Authentication flow (redirect to login)
npm run test:e2e:login-flow  # Full login process (UI-based)
npm run test:e2e:protected   # Protected routes
npm run test:e2e:data        # Data operations
npm run test:e2e:public      # Public routes
npm run test:e2e:login       # Login page analysis
```

## Test Credentials

Test credentials are stored in the `.env.test` file. To run tests, you need:

1. A valid test user in your LDAP directory
2. The appropriate credentials in your `.env.test` file:
   ```
   TEST_USERNAME=your-test-user
   TEST_PASSWORD=your-test-password
   ```

## Troubleshooting Tests

If you encounter authentication issues:

1. **Check Screenshots**: Look at the screenshots in `tests/screenshots/` to see what's happening visually
2. **Inspect Login Page**: Run `npm run test:e2e:login` to analyze the login page structure
3. **Cookie Authentication**: The cookie-based authentication may need adjustments based on your NextAuth.js configuration
   - You may need to generate a valid JWT token instead of using fake values
   - Consider modifying the `sessionLogin.js` command to handle your specific auth requirements

## Adding New Tests

When adding new tests:

1. For tests that don't focus on the login process itself, use `sessionLogin()` for faster execution
2. For pages that need authenticated access, use `login()` command at the beginning
3. Add appropriate `data-testid` attributes to key elements in your application for more reliable selectors

## Test Database

Consider using a separate test database to avoid affecting production data. Update the `DATABASE_URL` in `.env.test` accordingly.