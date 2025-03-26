/**
 * Test file to verify that public routes work correctly
 */
describe('Public Routes', function() {
  it('should access the home page successfully', function(browser) {
    browser
      .url(browser.launch_url)
      .waitForElementVisible('body', 10000)
      
      // Take a screenshot to see the home page content
      .saveScreenshot('tests/screenshots/public-home-page.png')
      .end();
  });

  it('should load the login page directly', function(browser) {
    browser
      .url(browser.launch_url + '/api/auth/signin')
      .waitForElementVisible('body', 10000)
      
      // Take a screenshot to see the login page content
      .saveScreenshot('tests/screenshots/public-login-page.png')
      .end();
  });
});