// cypress/support/e2e.ts
// This is a great place to put global configuration and behavior that modifies Cypress.
// You can change the location of this file or turn off loading
// the support file with the 'supportFile' configuration option.

// Import commands.js using ES2015 syntax:
import "./commands";

// Import our auth hooks that will intercept Auth.js session requests
import { setupAuthInterception } from "./auth-hooks";

// Setup auth interception to bypass authentication in tests
setupAuthInterception();

// Add global hooks like beforeEach or afterEach if needed across all tests
beforeEach(() => {
  // Example: cy.log('Starting a new test...');
});
afterEach(() => {
  // Example: cy.log('Finished a test...');
});

// Add other global hooks and configurations here
