/**
 * Test file for features that require authentication
 * Uses session login (cookie-based) for efficiency
 */
describe('Protected Routes', function() {
  before(function(browser) {
    // Use cookie-based authentication for faster tests
    browser.sessionLogin('test-user-id', ['user', 'admin']);
  });
  
  it('should access dashboard successfully', function(browser) {
    browser
      .url(browser.launch_url + '/dashboard') // Replace with your actual route
      .waitForElementVisible('body', 10000)
      // Just verify we're not redirected to login
      .assert.not.urlContains('/api/auth/signin')
      .saveScreenshot('tests/screenshots/dashboard-access.png');
  });
  
  it('should access servers page successfully', function(browser) {
    browser
      .url(browser.launch_url + '/servers') // Replace with your actual route
      .waitForElementVisible('body', 10000)
      // Just verify we're not redirected to login
      .assert.not.urlContains('/api/auth/signin')
      .saveScreenshot('tests/screenshots/servers-access.png');
  });
  
  // Add more tests for protected routes
  
  after(function(browser) {
    browser.end();
  });
});