import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.test" });

export async function POST(req: NextRequest) {
  const { db_name } = await req.json();
  if (!db_name.startsWith("test_")) {
    throw new Error("Database name must start with 'test_'");
  }
  process.env.DATABASE_NAME = db_name;
  // Connect to the default database
  console.log(`Connecting to default database postgres`);
  console.log(`Database user: ${process.env.DATABASE_USER}`)
  const client = new pg.Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: "postgres",
    password: process.env.DATABASE_PASSWORD,
    port: Number(process.env.DATABASE_PORT),
  });
  client.connect();
  
  // Create the new database
  console.log(`Creating test database ${db_name}`);
  await client.query(`CREATE DATABASE ${db_name}`);
  client.end();
  
  return NextResponse.json({ message: `Test database ${db_name} created successfully` });
}