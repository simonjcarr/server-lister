import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

// Create a PostgreSQL connection pool
console.log(`Database URL: ${process.env.DATABASE_URL}`);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: false,
});

// Create a drizzle instance
export const db = drizzle(pool, { schema });
