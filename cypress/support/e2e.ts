// cypress/support/e2e.js
// This is a great place to put global configuration and behavior that modifies Cypress.
// You can change the location of this file or turn off loading
// the support file with the 'supportFile' configuration option.

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// You can also import custom commands from other files
// Example: import './customAuthCommands'

// Add global hooks like beforeEach or afterEach if needed across all tests
beforeEach(() => {
  // Example: cy.log('Starting a new test...');
});
afterEach(() => {
  // Example: cy.log('Finished a test...');
});

// Add other global hooks and configurations here
