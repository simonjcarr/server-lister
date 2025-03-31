/**
 * Common imports for Drizzle schema definitions.
 * These are re-exported for use in other schema files.
 * 
 * This avoids having to import these in multiple files.
 */

// Re-export all common Drizzle imports
export { sql } from "drizzle-orm";
export { decimal } from "drizzle-orm/gel-core";
export { 
  pgTable, 
  text, 
  integer, 
  uniqueIndex, 
  index, 
  primaryKey, 
  boolean, 
  timestamp, 
  serial, 
  json, 
  pgEnum, 
  jsonb, 
  doublePrecision 
} from "drizzle-orm/pg-core";
export { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
export { z } from "zod";
