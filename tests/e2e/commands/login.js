/**
 * Custom Nightwatch command to handle the Dex LDAP login flow
 */
module.exports = class Login {
  async command(username = process.env.TEST_USERNAME, password = process.env.TEST_PASSWORD) {
    const browser = this.api;
    
    // Go to home page - will redirect to login if not authenticated
    await browser.url(browser.launch_url);
    
    // Check if we're already logged in
    // We'll try to navigate to a protected page and see if we get redirected
    let loggedIn = false;
    try {
      // Save current URL
      let result = await browser.url();
      const initialUrl = result.toString();
      
      // Try to access a protected route
      await browser.url(browser.launch_url + '/dashboard');
      await browser.waitForElementVisible('body', 5000);
      
      // Get the current URL after navigation
      result = await browser.url();
      const currentUrl = result.toString();
      
      // If not redirected to signin, we're logged in
      loggedIn = !currentUrl.includes('/api/auth/signin');
      
      // Go back to initial URL if not already logged in
      if (!loggedIn) {
        await browser.url(initialUrl);
        await browser.waitForElementVisible('body', 5000);
      }
    } catch (e) {
      loggedIn = false;
      console.error('Error checking login status:', e);
    }
    
    if (loggedIn) {
      console.log('Already logged in, skipping login process');
      return browser;
    }
    
    // Navigate to login page if not already there
    result = await browser.url();
    const currentUrl = result.toString();
    if (!currentUrl.includes('/api/auth/signin')) {
      await browser.url(browser.launch_url + '/api/auth/signin');
      await browser.waitForElementVisible('body', 5000);
    }
    
    // Take a screenshot of login page for debugging
    await browser.saveScreenshot('tests/screenshots/before-login.png');
    
    // Click on "Sign in with Login with Dex" button
    // Using the class selector we found from our login page analysis
    await browser
      .waitForElementVisible('button.button', 10000)
      .click('button.button');
    
    // Wait for redirect to Dex server and take a screenshot to see where we are
    await browser.waitForElementVisible('body', 10000);
    await browser.saveScreenshot('tests/screenshots/after-dex-redirect.png');
    
    // Click "Login with LDAP" button if it exists
    try {
      await browser
        .waitForElementVisible('a[href*="/auth/ldap"]', 5000)
        .click('a[href*="/auth/ldap"]');
      
      // On the LDAP login page, fill in credentials and submit
      await browser
        .waitForElementVisible('form input[name="login"]', 10000)
        .setValue('input[name="login"]', username)
        .setValue('input[name="password"]', password)
        .click('button[type="submit"]');
      
      // Wait for successful login and redirect back to the app
      // Wait a longer time as the authentication can take a while
      await browser.waitForElementVisible('body', 20000);
      await browser.saveScreenshot('tests/screenshots/after-login-submit.png');
    } catch (e) {
      console.error('Error during login flow:', e);
      // Take a screenshot to see where we got stuck
      await browser.saveScreenshot('tests/screenshots/login-error.png');
    }
    
    // Check if we're back in the application
    await browser.saveScreenshot('tests/screenshots/final-login-state.png');
    
    return browser;
  }
};