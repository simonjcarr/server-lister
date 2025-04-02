// scripts/safeMigrate.js
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2);
const migrationsPath = args.find(arg => arg.startsWith('--migrations-path='))?.split('=')[1] || './drizzle';

async function safeMigrate() {
  console.log('---------------------');
  console.log('Starting database migration...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Current working directory:', process.cwd());
  console.log('Using migrations folder:', path.resolve(migrationsPath));
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set!');

  // Verify migrations directory exists
  try {
    const migrationFiles = fs.readdirSync(migrationsPath);
    console.log(`Found ${migrationFiles.length} migration files:`, migrationFiles);
  } catch (error) {
    console.error(`Error reading migrations directory (${migrationsPath}):`, error.message);
    console.log('Attempting to continue anyway...');
  }

  // Initialize database connection
  let pool;
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Add connection timeout for better error reporting
      connectionTimeoutMillis: 5000,
    });
    
    // Test database connection
    const connTestResult = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', connTestResult.rows[0].now);
    
    const db = drizzle(pool);

    // Check if migrations table exists
    try {
      const migTableResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'drizzle_migrations'
        );
      `);
      
      console.log('Migrations table exists:', migTableResult.rows[0].exists);
      
      if (migTableResult.rows[0].exists) {
        // Show applied migrations
        const migrations = await pool.query('SELECT * FROM drizzle_migrations ORDER BY id;');
        console.log('Previously applied migrations:', 
          migrations.rows.map(row => `ID: ${row.id}, Hash: ${row.hash}, Applied: ${row.created_at}`));
      }
    } catch (error) {
      console.log('Could not check migration history (likely first run):', error.message);
    }

    // Run migrations
    console.log('Running migrations...');
    await migrate(db, { 
      migrationsFolder: migrationsPath,
      migrationsTable: 'drizzle_migrations',
      migrationsSchema: 'public'
    });
    
    console.log('Migration completed successfully');
    
    // Verify migrations by checking a few tables
    console.log('Verifying database state after migration...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`Database contains ${tables.rows.length} tables:`);
    console.log(tables.rows.map(row => row.table_name).join(', '));
    
  } catch (error) {
    console.error('Migration failed with error:');
    console.error(error.message);
    
    // Enhanced error reporting
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.detail) {
      console.error(`Error detail: ${error.detail}`);
    }
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack.split('\n').slice(0, 5).join('\n'));
    }
    
    // Check for specific errors
    if (error.code === '42710') { // Type already exists
      console.log('Detected existing type error. This usually happens with enums.');
      console.log('Consider using IF NOT EXISTS in your schema definition.');
    } else if (error.code === '42P01') { // Relation doesn't exist
      console.log('Table or relation does not exist. Check your schema references.');
    } else if (error.code === '28P01') { // Authentication failed
      console.log('Authentication failed. Check your database credentials.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused. Check if database server is running and accessible.');
    }
    
    console.log('Continuing deployment despite migration error');
  } finally {
    if (pool) {
      await pool.end();
      console.log('Database connection closed');
    }
    console.log('Migration process completed');
    console.log('---------------------');
  }
}

// Execute the migration
safeMigrate();