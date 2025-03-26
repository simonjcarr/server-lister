/**
 * Test file to verify authentication flow works correctly
 */
describe('Authentication Flow', function() {
  it('should redirect to login page when not authenticated', function(browser) {
    browser
      // Go to a protected page
      .url(browser.launch_url + '/dashboard')
      .waitForElementVisible('body', 10000)
      
      // Verify we get redirected to signin
      .assert.urlContains('/api/auth/signin')
      
      // Take a screenshot to see what's actually on the login page
      .saveScreenshot('tests/screenshots/login-page.png')
      .end();
  });
});