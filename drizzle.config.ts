import type { Config } from "drizzle-kit";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.local');
}

export default {
  schema: "./src/db/schema.ts", // Path to schema definitions
  out: "./drizzle", // Output folder for migrations
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
