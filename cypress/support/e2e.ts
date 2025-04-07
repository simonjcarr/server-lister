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
beforeEach(async () => {
  // Create random string with the following format test_xxxxxxxx where xxxxxxxx is 8 random numbers
  randomDatabaseName = `test_${Math.floor(Math.random() * 100000000)}`;
  
  // insert random string into database
  console.log(`Creating database ${randomDatabaseName}`);
  const createDatabaseResponse = await fetch(`/api/cypress/create-database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ db_name: randomDatabaseName }),
  });
  if (!createDatabaseResponse.ok) {
    throw new Error(`Failed to create database ${randomDatabaseName}`);
  } else {
    console.log(`Database ${randomDatabaseName} created successfully`);
  }
});
afterEach(async () => {
  // Example: cy.log('Finished a test...');
  console.log(`Dropping database ${randomDatabaseName}`);
  const dropDatabaseResponse = await fetch(`/api/cypress/drop-database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ db_name: randomDatabaseName }),
  });
  if (!dropDatabaseResponse.ok) {
    throw new Error(`Failed to drop database ${randomDatabaseName}`);
  } else {
    console.log(`Database ${randomDatabaseName} dropped successfully`);
  }
});

// Add other global hooks and configurations here
