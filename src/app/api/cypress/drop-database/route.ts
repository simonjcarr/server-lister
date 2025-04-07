import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.test" });

export async function POST(req: NextRequest) {
  const { db_name } = await req.json();
  if(!db_name.startsWith("test_")) {
    throw new Error("Database name must start with 'test_'")
  }
  // Connect to the default database
  console.log(`Connecting to default database postgres`);
  const client = new pg.Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: "postgres",
    password: process.env.DATABASE_PASSWORD,
    port: Number(process.env.DATABASE_PORT),
  });
  client.connect();
  
  try {
    // First, terminate all connections to the database
    console.log(`Terminating all connections to database ${db_name}`);
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${db_name}'
        AND pid <> pg_backend_pid();
    `);
    
    // Now drop the database
    console.log(`Dropping test database ${db_name}`);
    // await client.query(`DROP DATABASE ${db_name}`);
    
    return NextResponse.json({ message: `Test database ${db_name} dropped successfully` });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error dropping database: ${errorMessage}`);
    return NextResponse.json({ 
      message: `Failed to drop database ${db_name}`,
      error: errorMessage 
    }, { status: 500 });
  } finally {
    // Always close the client connection
    client.end();
  }
}