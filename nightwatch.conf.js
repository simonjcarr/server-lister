// Nightwatch configuration file

module.exports = {
  src_folders: ['tests/e2e'],
  
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
          args: ['--headless', '--no-sandbox', '--disable-gpu']
        }
      },
      screenshots: {
        enabled: true,
        on_failure: true,
        on_error: true,
        path: 'tests/screenshots'
      }
    }
  }
};
