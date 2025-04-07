import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import * as db from "../../../../db";
import { exec } from "child_process";
import { promisify } from "util";

dotenv.config({ path: ".env.test" });

// Promisify exec for easier async/await usage
const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { db_name } = await req.json();
  
  if (!db_name.startsWith("test_")) {
    throw new Error("Database name must start with 'test_'");
  }
  
  // Set the database name in the global context (for client-side code)
  if (typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem('testDatabaseName', db_name);
  }
  
  // Save the test database name to a file for server components 
  db.setTestDatabaseName(db_name);
  
  // Also set environment variables for fallback
  process.env.DYNAMIC_TEST_DB = db_name;
  process.env.TEST_DATABASE_NAME = db_name;
  
  // Refresh the database connection using our exported function in db/index.ts
  db.refreshDbConnection();
  
  // Only run migrations when in test mode
  if (process.env.NODE_ENV === 'test' || process.env.CYPRESS_TESTING === 'true') {
    try {
      const projectRoot = process.cwd();
      
      // Run the migration command with proper environment variables
      const migrationCmd = `cd ${projectRoot} && NODE_ENV=test TEST_DATABASE_NAME=${db_name} npx drizzle-kit migrate --config=drizzle.config.test.ts`;
      
      const { stderr } = await execAsync(
        migrationCmd,
        { 
          env: { 
            ...process.env, 
            TEST_DATABASE_NAME: db_name, 
            DYNAMIC_TEST_DB: db_name,
            // Pass explicit database credentials to ensure they're available in subprocess
            DATABASE_HOST: process.env.DATABASE_HOST,
            DATABASE_PORT: process.env.DATABASE_PORT,
            DATABASE_USER: process.env.DATABASE_USER,
            DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
            DATABASE_URL: 'test'
          } 
        }
      );
      
      if (stderr) console.error('Migration errors:', stderr);
      
      return NextResponse.json({ 
        message: `Database connection refreshed and migrations run for ${db_name}`,
        success: true 
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return NextResponse.json(
        { 
          message: `Database connection refreshed but migrations failed for ${db_name}`,
          error: errorMessage,
          success: false 
        },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json({ 
    message: `Database connection refreshed for ${db_name}`,
    success: true 
  });
}
