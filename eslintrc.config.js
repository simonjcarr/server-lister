module.exports = {
  extends: [
    "next/core-web-vitals",
    "next",
  ],
  rules: {
    // Disable no-unused-vars for TypeScript
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_",
    }],

    // More permissive about any usage (warning instead of error)
    "@typescript-eslint/no-explicit-any": "warn",

    // Only warn about React Hook exhaustive-deps
    "react-hooks/exhaustive-deps": "warn",

    // Only warn about img element usage
    "@next/next/no-img-element": "warn",

    // Only warn about unescaped entities
    "react/no-unescaped-entities": "warn"
  }
};
