// The migrate command to run for test is as follows
// NODE_ENV=test TEST_DATABASE_NAME=test_xxxxxxxx npx -y dotenv -e .env.test -- drizzle-kit migrate --config=drizzle.config.test.ts

import type { Config } from "drizzle-kit";
// import * as dotenv from 'dotenv';
// dotenv.config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.test');
}

const databaseName = process.env.TEST_DATABASE_NAME
const databaseURL = `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${databaseName}`

export default {
  schema: "./src/db/schema/index.ts", // Path to schema definitions
  out: "./drizzle", // Output folder for migrations
  dialect: "postgresql",
  dbCredentials: {
    url: databaseURL,
  },
} satisfies Config;
