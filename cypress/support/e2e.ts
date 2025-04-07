// cypress/support/e2e.ts
// This is a great place to put global configuration and behavior that modifies Cypress.
// You can change the location of this file or turn off loading
// the support file with the 'supportFile' configuration option.


// Import commands.js using ES2015 syntax:
import "./commands";

// Import our auth hooks that will intercept Auth.js session requests
import { setupAuthInterception } from "./auth-hooks";

// Make sure we are reading in the environment from .env.test
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, ".env.test") });
let randomDatabaseName = ""
// Setup auth interception to bypass authentication in tests
setupAuthInterception();

// Add global hooks like beforeEach or afterEach if needed across all tests
beforeEach(() => {
  // Create random string with the following format test_xxxxxxxx where xxxxxxxx is 8 random numbers
  randomDatabaseName = `test_${Math.floor(Math.random() * 100000000)}`;
  
  // Store the database name in localStorage for the db connection to use
  cy.window().then((win) => {
    win.localStorage.setItem('testDatabaseName', randomDatabaseName);
  });
  
  // Create the test database - proper Cypress command chaining
  cy.request({
    method: 'POST',
    url: '/api/cypress/create-database',
    body: { db_name: randomDatabaseName },
    failOnStatusCode: true
  }).then(response => {
    expect(response.status).to.eq(200);
  });
  
  // Refresh the connection and run migrations - as a separate command
  cy.request({
    method: 'POST',
    url: '/api/cypress/refresh-db-connection',
    body: { db_name: randomDatabaseName },
    failOnStatusCode: true
  }).then(response => {
    expect(response.status).to.eq(200);
  });
});

afterEach(() => {
  // Drop the database after the test has completed
  cy.request({
    method: 'POST',
    url: '/api/cypress/drop-database',
    body: { db_name: randomDatabaseName },
    failOnStatusCode: true
  }).then(response => {
    expect(response.status).to.eq(200);
  });
  
  // Clear the database name from localStorage
  cy.window().then((win) => {
    win.localStorage.removeItem('testDatabaseName');
  });
});

// Add other global hooks and configurations here
