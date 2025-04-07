describe("Managing locations", () => {
  it("should add a new location", () => {
    cy.visit("/");
    cy.get('[data-testid="nav-drawer-button"]').should("exist");
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.contains("Menu").should("exist");
    cy.contains("Location").should("exist");
    
    // find item with testid test-left-menu-location
    cy.get('[data-testid="test-left-menu-location"]').should("exist");
    cy.get('[data-testid="test-left-menu-location"]').click();
    
    // find item with testid test-left-menu-location-add
    cy.get('[data-testid="test-left-menu-location-add"]').should("exist");
    cy.get('[data-testid="test-left-menu-location-add"]').click();
    
    // find drawer with testid test-add-location-drawer
    cy.get('[data-testid="test-add-location-drawer"]').should("exist");
    cy.wait(500);
    // find input with testid test-add-location-name
    cy.get('[data-testid="test-add-location-name"]').should("exist");
    cy.get('[data-testid="test-add-location-name"]').type("New Location20");

    cy.get('[data-testid="test-form-add-location-submit-button"]').should("exist");
    cy.get('[data-testid="test-form-add-location-submit-button"]').click();
    cy.wait(1000);

    // Location has been created successfully
    cy.contains("Location has been created successfully").should("exist");

  })
})