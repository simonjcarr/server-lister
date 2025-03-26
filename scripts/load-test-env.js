// scripts/load-test-env.js
const path = require('path');
const dotenv = require('dotenv');

// Load the test environment variables
function loadTestEnv() {
  const testEnvPath = path.resolve(process.cwd(), '.env.test');
  const result = dotenv.config({ path: testEnvPath });
  
  if (result.error) {
    console.error('Error loading test environment variables:', result.error);
    throw result.error;
  }
  
  console.log('Loaded test environment variables from .env.test');
}

// Export the function for use in test scripts
module.exports = loadTestEnv;

// If this script is run directly, load the env variables
if (require.main === module) {
  loadTestEnv();
}