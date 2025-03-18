describe('Basic Test', function() {
  it('Verifies that 1 equals 1', function(browser) {
    // This is a simple test to confirm that Nightwatch testing is working
    browser
      .perform(() => {
        const result = 1 === 1;
        browser.assert.equal(result, true, '1 should equal 1');
      })
      .end();
  });
});
