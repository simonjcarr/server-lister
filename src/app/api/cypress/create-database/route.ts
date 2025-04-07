import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import pg from "pg";
import * as db from "../../../../db";

dotenv.config({ path: ".env.test" });

export async function POST(req: NextRequest) {
  const { db_name } = await req.json();
  if (!db_name.startsWith("test_")) {
    throw new Error("Database name must start with 'test_'");
  }
  
  // Save the database name to multiple places for redundancy
  process.env.DATABASE_NAME = db_name;
  process.env.TEST_DATABASE_NAME = db_name;
  process.env.DYNAMIC_TEST_DB = db_name;
  
  // Also save to our file-based storage for server components
  db.setTestDatabaseName(db_name);
  
  // Connect to the default database
  console.log(`Connecting to default database postgres`);
  console.log(`Database host: ${process.env.DATABASE_HOST}, port: ${process.env.DATABASE_PORT}`);
  console.log(`Database user: ${process.env.DATABASE_USER}`);
  
  const client = new pg.Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: "postgres",
    password: process.env.DATABASE_PASSWORD,
    port: Number(process.env.DATABASE_PORT),
  });
  
  try {
    await client.connect();
    
    // Check if database already exists and drop it if it does
    console.log(`Checking if database ${db_name} already exists`);
    const checkResult = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${db_name}'`);
    
    if (checkResult && checkResult.rowCount && checkResult.rowCount > 0) {
      console.log(`Database ${db_name} already exists, dropping it first`);
      // We need to disconnect everyone first
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${db_name}'
          AND pid <> pg_backend_pid()
      `);
      await client.query(`DROP DATABASE ${db_name}`);
    }
    
    // Create the new database
    console.log(`Creating test database ${db_name}`);
    await client.query(`CREATE DATABASE ${db_name}`);
    
    // Store in localStorage for browser if available
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem('testDatabaseName', db_name);
    }
    
    return NextResponse.json({ message: `Test database ${db_name} created successfully` });
  } catch (error) {
    console.error('Error creating test database:', error);
    return NextResponse.json(
      { message: `Failed to create test database ${db_name}`, error: String(error) },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}