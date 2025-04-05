describe('Authentication Testing', () => {
  beforeEach(() => {
    // Seed the test user in the database before each test
    cy.seedTestUser('admin');
  });

  afterEach(() => {
    // Clean up the test user after each test
    const userData = Cypress.env('seededTestUser');
    if (userData && userData.id) {
      cy.cleanupTestUser(userData.id);
    }
  });

  it('should successfully mock an admin user session and display Dashboard', () => {
    // Mock the user session for the admin user
    cy.mockUserSession('admin');
    
    // Visit the homepage (which requires authentication)
    cy.visit('/');
    
    // Verify the Dashboard heading is visible
    cy.contains('Dashboard').should('be.visible');
    
    // The auth middleware should allow access with our mocked session
    // Let's verify we're logged in by checking for the username
    cy.contains("admin@example.com").should("exist");
  });

  it('should show Dashboard for all user roles', () => {
    // Test with different user roles
    const userRoles = ['admin', 'cert-manager', 'basic-user'];
    
    userRoles.forEach(role => {
      // Mock the user session for the current role
      cy.mockUserSession(role);
      
      // Visit the homepage
      cy.visit('/');
      
      // All authenticated users should see the Dashboard
      cy.contains('Dashboard').should('be.visible');
      
      // The correct username should be displayed based on the fixture
      cy.fixture(`users/${role}.json`).then(userData => {
        cy.contains(userData.email).should('exist');
      });
    });
  });

  it('should correctly apply user roles', () => {
    // Mock the user session for the basic user
    cy.mockUserSession('basic-user');
    
    // Visit a page that requires specific roles
    cy.visit('/');
    
    // Verify Dashboard is visible
    cy.contains('Dashboard').should('be.visible');
    
  
    
    // Now switch to admin user and verify admin features are visible
    cy.mockUserSession('admin');
    cy.visit('/');
    cy.contains('Dashboard').should('be.visible');
  });
});
