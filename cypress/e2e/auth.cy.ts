/// <reference types="cypress" />

describe("Home Page Access After Login", () => {
  it('should display "Dashboard" on the home page with intercepted authentication', () => {
    // Our auth-hooks.ts will automatically intercept /api/auth/session
    // and return an authenticated user, so we can directly visit the page
    cy.visit("/");
    
    // Add debugging to help diagnose any issues
    cy.url().then(url => {
      cy.log(`Current URL: ${url}`);
    });
    
    // We should see the Dashboard since we're authenticated via the intercepted session
    cy.contains("Dashboard").should("exist");
  });
});
