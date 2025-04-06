/// <reference types="cypress" />

// Define the interface for your user fixture if you want stronger typing
// This is optional but recommended
interface UserFixture {
  email: string;
  name: string;
  role: string;
  // Add other properties from your user fixture JSON files
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Loads a user fixture JSON file by name.
       * @example cy.loadUserFixture('admin')
       */
      loadUserFixture(userName: string): Chainable<UserFixture>; // Or Chainable<any>

      /**
       * Logs in a user via backend task and sets session cookie.
       * Yields undefined upon completion.
       * @example cy.login(adminUser)
       */
      login(userFixture: UserFixture): Chainable<undefined>; // <-- Ensure this is Chainable<undefined>
    }
  }
}


// Export {} needed to make the file a module (and avoid global scope pollution potential)
export {};
