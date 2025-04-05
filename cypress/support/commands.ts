/// <reference types="cypress" />
import { createJwtResponse, createSessionResponse } from '../fixtures/session';

// Type definitions for Cypress commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock a user session for testing
       * @param userFixture - Fixture name for the test user (without extension)
       * @example cy.mockUserSession('admin')
       */
      mockUserSession(userFixture: string): Chainable<void>;
      
      /**
       * Custom command to seed a test user in the database
       * @param userFixture - Fixture name for the test user (without extension)
       * @example cy.seedTestUser('admin')
       */
      seedTestUser(userFixture: string): Chainable<void>;
      
      /**
       * Custom command to clean up a test user from the database
       * @param userId - ID of the test user to clean up
       * @example cy.cleanupTestUser('admin-user-id-1234')
       */
      cleanupTestUser(userId: string): Chainable<void>;
    }
  }
}

// Command to mock a user session
Cypress.Commands.add('mockUserSession', (userFixture) => {
  // Load the user fixture
  cy.fixture(`users/${userFixture}.json`).then((userData) => {
    // Create session and JWT responses
    const sessionResponse = createSessionResponse(userData);
    const jwtResponse = createJwtResponse(userData);
    
    // Intercept the Next-Auth session endpoints
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: sessionResponse
    }).as('getSession');
    
    // Intercept the Next-Auth JWT endpoint
    cy.intercept('GET', '/api/auth/csrf', {
      statusCode: 200,
      body: {
        csrfToken: 'mock-csrf-token'
      }
    }).as('getCsrfToken');
    
    // Intercept the Next-Auth callback endpoint
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 200,
      body: {
        url: '/'
      }
    }).as('authCallback');
    
    // Set necessary cookies to bypass middleware auth check
    cy.setCookie('next-auth.session-token', 'mock-session-token');
    cy.setCookie('next-auth.csrf-token', 'mock-csrf-token');
    cy.setCookie('next-auth.callback-url', '/');
    
    // Store user data in Cypress for later use
    Cypress.env('currentTestUser', userData);
  });
});

// Command to seed a test user in the database
Cypress.Commands.add('seedTestUser', (userFixture) => {
  cy.task('seedTestUser', userFixture).then((userData) => {
    // Store the seeded user data for later cleanup
    Cypress.env('seededTestUser', userData);
  });
});

// Command to clean up a test user from the database
Cypress.Commands.add('cleanupTestUser', (userId) => {
  cy.task('removeTestUser', userId);
});

// Add other custom commands here
