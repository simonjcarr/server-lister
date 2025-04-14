describe("Server Creation E2E Flow", () => {
  // Generate random test data to avoid collisions
  const testId = Math.floor(Math.random() * 1000000);
  const testLocation = `Test Location ${testId}`;
  const testBusiness = `Test Business ${testId}`;
  const testProject = `Test Project ${testId}`;
  const testOSFamily = `Test OS Family ${testId}`;
  const testOS = `Test OS ${testId}`;
  const testServer = `testserver${testId}`;
  
  it("should create all resources and verify the server exists", () => {
    // First, navigate to the home page
    cy.visit("/");
    
    // Step 1: Create a Location
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.get('[data-testid="test-left-menu-location"]').should("exist");
    cy.get('[data-testid="test-left-menu-location"]').click();
    cy.get('[data-testid="test-left-menu-location-add"]').should("exist");
    cy.get('[data-testid="test-left-menu-location-add"]').click();
    
    // Fill out the location form
    cy.get('[data-testid="test-add-location-drawer"]').should("exist");
    cy.wait(500);
    cy.get('[data-testid="test-add-location-name"]').should("exist");
    cy.get('[data-testid="test-add-location-name"]').type(testLocation);
    cy.get('[data-testid="test-form-add-location-submit-button"]').click();
    cy.wait(3000);
    
    // Verify location was created
    cy.contains("Location has been created successfully").should("exist");
    cy.get('button[aria-label="Close"]').click();
    cy.wait(2000);
    // Step 2: Create a Business
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.get('[data-testid="test-left-menu-business"]').should("exist");
    cy.get('[data-testid="test-left-menu-business"]').click();
    cy.get('[data-testid="test-left-menu-business-add"]').should("exist");
    cy.get('[data-testid="test-left-menu-business-add"]').click();
    
    // Fill out the business form
    cy.get(".ant-drawer-content").should("be.visible");
    cy.wait(500);
    cy.get('[data-testid="test-form-add-business-name"]').should("exist");
    cy.get('[data-testid="test-form-add-business-name"]').type(testBusiness);
    cy.wait(1000)
    cy.get('[data-testid="test-form-add-business-submit-button"]').click();
    cy.wait(1000);
    
    // Verify business was created
    cy.contains("Business created successfully").should("exist");
    
    // Step 3: Create a Project
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.get('[data-testid="test-left-menu-project"]').should("exist");
    cy.get('[data-testid="test-left-menu-project"]').click();
    cy.wait(500);
    cy.get('[data-testid="test-left-menu-project-add"]').should("exist");
    cy.get('[data-testid="test-left-menu-project-add"]').click();
    
    // Fill out the project form
    cy.wait(500)
    cy.get(".ant-drawer-content").should("be.visible");
    cy.get('[data-testid="test-form-add-project-name"]').type(testProject);
    
    // Select the business we just created
    cy.get('[data-testid="test-form-add-project-business"]').should("exist");
    cy.get('[data-testid="test-form-add-project-business"]').click();
    cy.wait(500)
    cy.contains(testBusiness).click();
    
    cy.contains("Create Project").click();
    cy.wait(500);
    
    // Verify project was created
    cy.contains("Project created successfully").should("exist");
    cy.get(".ant-notification-notice-close").click();
    cy.wait(500);
    cy.get('.ant-drawer-open .ant-drawer-close').click();
    
    // Step 4: Create an OS Family
    cy.get('[data-testid="nav-drawer-button"]').click();

    // Open the server menu
    cy.get('[data-testid="test-left-menu-server"]').should("exist");
    cy.get('[data-testid="test-left-menu-server"]').click();
    cy.wait(500);
    cy.get('[data-testid="test-left-menu-os"]').should("exist");
    cy.get('[data-testid="test-left-menu-os"]').click();
    cy.wait(500);
    cy.get('[data-testid="test-left-menu-os-add"]').should("exist");
    cy.get('[data-testid="test-left-menu-os-add"]').click();
    cy.wait(500);
    
    
    // Switch to OS Family tab
    cy.get(".ant-tabs-tab-btn").contains("OS Family").click();
    cy.wait(500);
    
    // Fill out the OS Family form
    cy.get('[data-testid="add-os-form-family-name"]').type(testOSFamily);
    cy.get('[data-testid="add-os-family-button"]').click();
    cy.wait(1000);
    
    // Verify OS Family was created
    cy.contains("OS Family has been created successfully").should("exist");
    cy.get(".ant-notification-notice-close").click();
    
    // Step 5: Create an OS
    cy.get(".ant-tabs-tab-btn").contains("Operating System").click();
    cy.wait(500);
    
    // Fill out the OS form
    cy.get('input[name="name"]').eq(0).clear().type(testOS);
    cy.get('input[name="version"]').type("1.0");
    
    // Select the OS Family we just created
    cy.get('.ant-select').eq(0).click();
    cy.contains(testOSFamily).click();
    
    // Set EOL date (1 year from today)
    const eolDate = new Date();
    eolDate.setFullYear(eolDate.getFullYear() + 1);
    const formattedDate = eolDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').type(formattedDate);
    
    cy.get('button[type="submit"]').eq(0).click();
    cy.wait(500);
    
    // Verify OS was created
    cy.contains("OS has been created successfully").should("exist");
    
    // Step 6: Create a new server
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.contains("Servers").click();
    cy.contains("Add Server").click();
    
    // Fill out the server form
    cy.get('input[name="hostname"]').type(testServer);
    cy.get('input[name="ipv4"]').type("192.168.1.1");
    
    // Select the OS we created
    cy.get('.ant-select').eq(0).click();
    cy.contains(testOS).click();
    
    // Select the Location we created
    cy.get('.ant-select').eq(1).click();
    cy.contains(testLocation).click();
    
    // Select the Business we created
    cy.get('.ant-select').eq(2).click();
    cy.contains(testBusiness).click();
    
    // Select the Project we created
    cy.get('.ant-select').eq(3).click();
    cy.contains(testProject).click();
    
    // Submit the form
    cy.contains("Add Server").click();
    cy.wait(500);
    
    // Verify server was created
    cy.contains("Server Created").should("exist");
    
    // Step 7: Visit the Server list page and verify our server exists
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.contains("Servers").click();
    cy.contains("Server List").should("exist");
    
    // Verify our server appears in the list
    cy.contains(testServer).should("exist");
  });
});