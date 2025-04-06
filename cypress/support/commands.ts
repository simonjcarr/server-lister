// cypress/support/commands.js

/// <reference types="cypress" />

// --- Interface Definitions ---
// Define the structure of user data loaded from fixture files.
interface UserFixture {
  email: string;
  name: string;
  role: string; // Or roles: string[] depending on your fixture
  // Add any other properties your user fixtures contain (e.g., id)
}

// Define the expected structure of the object returned by the 'generateJwt' task.
interface GenerateJwtResult {
  signedJwt: string; // The signed JWT string
  expires: string; // ISO 8601 date string for cookie expiry (matches JWT 'exp')
}

// --- Custom Command Implementations ---

/**
 * Loads a user fixture JSON file by name from cypress/fixtures/users/
 * @param {string} userName - The name of the fixture file (without .json extension).
 * @returns {Cypress.Chainable<UserFixture>} - Chainable yielding the loaded user fixture object.
 */
Cypress.Commands.add(
  "loadUserFixture",
  (userName: string): Cypress.Chainable<UserFixture> => {
    cy.log(`Loading user fixture: ${userName}`);
    // Use generic type argument with cy.fixture for type safety
    return cy.fixture<UserFixture>(`users/${userName}.json`);
  }
);

/**
 * Logs in a user for JWT strategy by generating a signed JWT via a backend task
 * and setting the session cookie with the JWT value.
 * Assumes the user identified by userFixture.email exists in the DB (for the task to fetch details).
 * @param {UserFixture} userFixture - The user fixture object (must contain 'email').
 * @returns {Cypress.Chainable<undefined>} - Chainable yielding undefined.
 */
Cypress.Commands.add(
  "login",
  (userFixture: UserFixture): Cypress.Chainable<undefined> => {
    // Validate input fixture
    if (!userFixture?.email) {
      throw new Error(
        "User fixture with an email property is required for cy.login()"
      );
    }

    // Retrieve cookie name from Cypress environment variables
    const cookieName: string | undefined = Cypress.env("NEXTAUTH_COOKIE_NAME");
    if (!cookieName) {
      throw new Error(
        "NEXTAUTH_COOKIE_NAME environment variable not set in cypress.config.js. Set it to your NextAuth session cookie name (e.g., 'next-auth.session-token' or '__Secure-next-auth.session-token')."
      );
    }

    cy.log(
      `Logging in (JWT Strategy) as ${userFixture.email} using cookie: ${cookieName}`
    );

    // Call the backend task to generate the signed JWT
    cy.task<GenerateJwtResult | null>(
      "generateJwt", // <--- Ensure this matches the task name in cypress.config.js
      { userEmail: userFixture.email }, // Argument passed to the task
      { log: true } // Cypress runner logs the task execution
    ).then((result) => {
      // Type Guard: Check if the task returned a valid result object
      if (!result?.signedJwt || !result?.expires) {
        console.error(
          "JWT Generation Task Result was invalid or null:",
          result
        );
        // Throw an error to fail the current test if JWT generation failed
        throw new Error(
          "JWT generation via cy.task failed or returned invalid data. Check Cypress runner log and terminal output (where Cypress Node events run) for task errors."
        );
      }

      // If we reach here, 'result' is confirmed to be of type GenerateJwtResult
      cy.log(
        `JWT generated via task for ${userFixture.email}. Setting cookie...`
      );

      // Clear the cookie first to ensure a clean state
      cy.clearCookie(cookieName, { log: true });

      // Calculate expiry for cy.setCookie (needs Unix timestamp in seconds)
      const expiryDate = new Date(result.expires);
      if (isNaN(expiryDate.getTime())) {
        throw new Error(
          `Invalid date string received from generateJwt task: ${result.expires}`
        );
      }
      const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);

      // Set the session cookie in the browser with the SIGNED JWT as its value
      cy.setCookie(cookieName, result.signedJwt, {
        // <--- Use the signed JWT here
        log: true,
        domain: new URL(Cypress.config("baseUrl") as string).hostname, // Get domain from Cypress config
        path: "/",
        secure: cookieName.startsWith("__Secure-"), // Determine secure flag based on standard prefix
        httpOnly: true, // Essential for session cookies
        expiry: expiryTimestamp, // Use expiry derived from JWT 'exp' claim
      });

      // Log successful login for clarity in Cypress runner
      Cypress.log({
        name: "login",
        message: `User ${userFixture.email} logged in via JWT session cookie`,
        consoleProps: () => ({
          // Provides details when log is clicked in runner
          user: userFixture,
          cookieName: cookieName,
          // Avoid logging the full JWT for security, maybe show partial or claims if needed
          jwtValue: `${result.signedJwt.substring(
            0,
            10
          )}...${result.signedJwt.slice(-10)}`,
          expires: result.expires,
        }),
      });
    });

    // Explicitly return Chainable<undefined> to match declared type and satisfy TS2355
    return cy.wrap(undefined, { log: false });
  }
);

// Make sure this file is imported in your main support file (e.g., cypress/support/e2e.js)
// Example line in cypress/support/e2e.js: import './commands'

// Adding export {} helps ensure TS treats this file as a module.
export {};
