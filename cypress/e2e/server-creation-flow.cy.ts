describe("Server Creation E2E Flow", () => {
  // Generate random test data to avoid collisions
  const testId = Math.floor(Math.random() * 1000000);
  const testLocation = `Test Location ${testId}`;
  const testBusiness = `Test Business ${testId}`;
  const testProject = `Test Project ${testId}`;
  const testOSFamily = `Test OS Family ${testId}`;
  const testOS = `Test OS ${testId}`;
  const testOSVersion = `1.0`;
  const testOSEOLDate = "2030-12-22";
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
    cy.wait(1000);
    
    // Verify location was created
    cy.contains("Location has been created successfully").should("exist");
    cy.get(".ant-notification-notice-close").click();
    cy.wait(500);
    cy.get(".ant-drawer-open .ant-drawer-close").click();
    cy.wait(500);
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
    cy.get('[data-testid="add-os-form-name"]').eq(0).clear().type(testOS);
    cy.get('[data-testid="add-os-form-version"]').type(testOSVersion);
    //Select os family
    cy.get('[data-testid="add-os-form-os-family"]').click();
    cy.contains(testOSFamily).click();
    
    cy.get('[data-testid="add-os-form-eol-date"]').type(testOSEOLDate);

    cy.get('[data-testid="add-os-button"]').click();
    cy.wait(1000);

    cy.contains("OS has been created successfully").should("exist");
    cy.get(".ant-notification-notice-close").click();
    cy.wait(500);
    cy.get(".ant-drawer-open .ant-drawer-close").click();
    
    // Step 6: Create a new server
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.contains("Server").click();
    cy.contains("Add Server").click();
    cy.wait(500)
    // Fill out the server form
    cy.get('[data-testid="form-add-server-hostname"]').type(testServer);
    cy.wait(2000)
    cy.get('[data-testid="form-add-server-ipv4"]').type("192.168.1.1");
    
    // Select the OS we created
    cy.get('[data-testid="form-add-server-os"]').click();
    cy.contains(testOS).click();
    
    // Select the Location we created
    cy.get('[data-testid="form-add-server-location"]').click();
    cy.contains(testLocation).click();
    
    // Select the Business we created
    // cy.get('[data-testid="form-add-server-business"]').click();
    cy.get('[data-testid="form-add-server-business"]').click();
    cy.get('.business-item').contains(testBusiness).click();
    
    // Select the Project we created
    cy.get('[data-testid="form-add-server-project"]').click();
    cy.get('.project-item').contains(testProject).click();
    
    // Submit the form
    cy.get('[data-testid="form-add-server-submit"]').click();
    cy.wait(500);
    
    // Verify server was created
    cy.contains("Server Created").should("exist");
    cy.wait(500);
    cy.get(".ant-drawer-open .ant-drawer-close").click();
    // Step 7: Visit the Server list page and verify our server exists
    cy.get('[data-testid="nav-drawer-button"]').click();
    cy.contains("Server").click();
    cy.contains("Server List").click();
    cy.wait(500);
    
    // Verify our server appears in the list
    cy.contains(testServer).should("exist");
  });
});