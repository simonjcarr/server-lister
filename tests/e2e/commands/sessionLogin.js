/**
 * Custom Nightwatch command to set authenticated session cookies
 * This bypasses the UI login flow completely
 */
module.exports = class SessionLogin {
  async command(userId = 'test-user-id', roles = ['user', 'admin']) {
    const browser = this.api;
    
    // First navigate to the site to ensure cookies are set on the right domain
    await browser.url(browser.launch_url);
    
    // Wait for the page to load
    await browser.waitForElementVisible('body', 5000);
    
    // For NextAuth.js, we need to create an encrypted token
    // This is a simplified version and may not work fully in production
    // For testing purposes only
    
    // Method 1: Create a fake session token
    await browser.setCookie({
      name: 'next-auth.session-token',
      value: `fake-session-token-${Date.now()}`,
      path: '/',
      domain: 'localhost',
      secure: false,
      httpOnly: false,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    });
    
    // Set additional cookies that NextAuth might use
    await browser.setCookie({
      name: 'next-auth.callback-url',
      value: browser.launch_url,
      path: '/',
      domain: 'localhost',
      secure: false,
      httpOnly: false,
      sameSite: 'Lax'
    });
    
    await browser.setCookie({
      name: 'next-auth.csrf-token',
      value: `csrf-token-${Date.now()}`,
      path: '/',
      domain: 'localhost',
      secure: false,
      httpOnly: false,
      sameSite: 'Lax'
    });
    
    // Refresh the page to try to activate the session
    await browser.refresh();
    
    // Take a screenshot to see the state after setting cookies
    await browser.saveScreenshot('tests/screenshots/after-session-login.png');
    
    return browser;
  }
};