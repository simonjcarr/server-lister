import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

// Create a PostgreSQL connection pool
console.log(`Database URL: ${process.env.DATABASE_URL}`);
console.log(`Database name: ${process.env.DATABASE_NAME}`)
if(!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL === 'test' 
   ? `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}` 
   : process.env.DATABASE_URL,
  ssl: false,
});

// Create a drizzle instance
export const db = drizzle(pool, { schema });
