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
  
  // Drop the database
  console.log(`Dropping test database ${db_name}`);
  await client.query(`DROP DATABASE ${db_name}`);
  client.end();
  
  return NextResponse.json({ message: `Test database ${db_name} dropped successfully` });
}