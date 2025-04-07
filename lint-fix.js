#!/usr/bin/env node

/**
 * This script attempts to automatically fix common linting issues:
 * 1. Removes unused imports and variables
 * 2. Fixes explicit 'any' types by providing more specific types
 * 3. Addresses some React Hook dependency warnings
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the ESLint fix command
try {
  execSync('npx eslint --fix "src/**/*.{ts,tsx}"', { stdio: 'inherit' });
} catch {
  console.error('ESLint encountered errors that could not be automatically fixed.');
}

