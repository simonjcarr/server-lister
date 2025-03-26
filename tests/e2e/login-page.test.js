/**
 * Test to explore what's actually on the login page
 * This is a diagnostic test to help with test development
 */
describe('Login Page Analysis', function() {
  it('should capture login page content', function(browser) {
    browser
      // Go to the login page directly
      .url(browser.launch_url + '/api/auth/signin')
      .waitForElementVisible('body', 10000)
      
      // Take a screenshot to analyze the page structure
      .saveScreenshot('tests/screenshots/login-page-full.png')
      
      // Try to find all potential login buttons/links
      .execute(function() {
        // This runs in the browser context
        let results = {
          buttons: [],
          links: [],
          forms: []
        };
        
        // Find all buttons
        document.querySelectorAll('button').forEach(btn => {
          results.buttons.push({
            text: btn.innerText,
            id: btn.id,
            class: btn.className
          });
        });
        
        // Find all links
        document.querySelectorAll('a').forEach(link => {
          results.links.push({
            text: link.innerText,
            href: link.href,
            id: link.id,
            class: link.className
          });
        });
        
        // Find all forms
        document.querySelectorAll('form').forEach(form => {
          results.forms.push({
            action: form.action,
            id: form.id,
            class: form.className
          });
        });
        
        return results;
      }, [], function(result) {
        // Log the results to help with debugging
        console.log('Login page elements:', JSON.stringify(result.value, null, 2));
      })
      .end();
  });
});