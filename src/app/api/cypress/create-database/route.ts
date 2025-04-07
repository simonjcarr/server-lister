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
    const checkResult = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${db_name}'`);
    
    if (checkResult && checkResult.rowCount && checkResult.rowCount > 0) {
      // We need to disconnect everyone first
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${db_name}'
          AND pid <> pg_backend_pid()
      `);
      await client.query(`DROP DATABASE ${db_name}`);
    }
    
    await client.query(`CREATE DATABASE ${db_name}`);
    
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