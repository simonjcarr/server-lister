import { defineConfig } from "cypress";
import { seedTestUser, removeTestUser } from "./cypress/support/db-seed/users";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register custom tasks for database operations
      on('task', {
        // Task to seed a test user in the database
        async seedTestUser(userFixture: string) {
          try {
            return await seedTestUser(userFixture);
          } catch (error) {
            console.error('Error seeding test user:', error);
            throw error;
          }
        },
        
        // Task to remove a test user from the database
        async removeTestUser(userId: string) {
          try {
            await removeTestUser(userId);
            return null;
          } catch (error) {
            console.error('Error removing test user:', error);
            throw error;
          }
        }
      });
      
      return config;
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
});
