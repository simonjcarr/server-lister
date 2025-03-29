// This script sets up the chat system by seeding categories

console.log('Setting up chat system...');

try {
  // Run the database migrations to ensure chat tables exist
  console.log('Running database migrations...');
  const { execSync } = require('child_process');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });

  // Now use Drizzle directly to create the categories
  console.log('Seeding chat categories...');
  const { Pool } = require('pg');
  const { drizzle } = require('drizzle-orm/node-postgres');
  require('dotenv').config();

  async function seedCategories() {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    // Create the categories
    const DEFAULT_CATEGORIES = [
      { name: "General", icon: "message-square" },
      { name: "Issues", icon: "alert-triangle" },
      { name: "Updates", icon: "refresh-cw" },
      { name: "Questions", icon: "help-circle" },
      { name: "Announcements", icon: "megaphone" },
    ];
    
    for (const category of DEFAULT_CATEGORIES) {
      // Create the category
      const now = new Date();
      try {
        console.log(`Creating category: ${category.name}`);
        await pool.query(
          'INSERT INTO chat_categories (name, icon, enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING', 
          [category.name, category.icon, true, now, now]
        );
      } catch (error) {
        console.log(`Error with category ${category.name}: ${error.message}`);
      }
    }
    
    console.log("Categories created successfully!");
    await pool.end();
  }
  
  // Run the seeding function
  seedCategories()
    .then(() => {
      console.log('Chat system setup complete!');
    })
    .catch(error => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('Error setting up chat system:', error);
  process.exit(1);
}
