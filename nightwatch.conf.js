// nightwatch.conf.js
require('dotenv').config(); // Load environment variables

module.exports = {
  src_folders: ['tests/e2e'],
  custom_commands_path: ['tests/e2e/commands'],
  
  webdriver: {
    start_process: true,
    server_path: require('chromedriver').path,
    port: 9515,
    host: 'localhost'
  },
  
  test_settings: {
    default: {
      launch_url: 'http://localhost:3000',
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          // Comment out headless for debugging
          args: ['--headless', '--no-sandbox', '--disable-gpu']
        }
      },
      screenshots: {
        enabled: true,
        on_failure: true,
        on_error: true,
        path: 'tests/screenshots'
      },
      globals: {
        // You can set default credentials here (though env vars are preferred)
        testUsername: process.env.TEST_USERNAME || 'test-user',
        testPassword: process.env.TEST_PASSWORD || 'test-password',
        waitForConditionTimeout: 10000 // Default timeout for waitFor commands
      }
    },
    // If needed, you can also create a visual mode for debugging
    visual: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--no-sandbox', '--disable-gpu']
        }
      }
    }
  }
};