/// <reference types="cypress" />

describe("Home Page Access After Login", () => {
  it('should display "Dashboard" on the home page after admin login', () => {
    cy.loadUserFixture("admin").then((adminUser) => {
      cy.login(adminUser);
    });

    // Add this line for debugging
    cy.getAllCookies().then((cookies) => {
      cy.log("Cookies set before visit:", cookies);
    });

    cy.visit("/");
    cy.contains("Dashboard").should("exist");
  });
});
