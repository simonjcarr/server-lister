/**
 * Test file to verify the full login flow
 */
describe('Login Flow', function() {
  it('should login via Dex LDAP', function(browser) {
    browser
      // Start the login process using our custom command
      .login()
      
      // After login, we should be able to access protected pages
      .url(browser.launch_url + '/dashboard') 
      .waitForElementVisible('body', 10000)
      
      // Verify we're not redirected to login
      .assert.not.urlContains('/api/auth/signin')
      
      // Take a screenshot to verify we're on the dashboard
      .saveScreenshot('tests/screenshots/post-login-dashboard.png')
      
      // End the session
      .end();
  });
});