import { pgTable, serial, text, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureKey: text("feature_key").notNull(),
  preferenceValue: jsonb("preference_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Create a unique constraint on userId + featureKey
  uniqueIndex("user_preferences_userId_feature_key_unique").on(table.userId, table.featureKey),
]);

// These schemas are used for type inference
export const insertUserPreferenceSchema = createInsertSchema(userPreferences);
export const selectUserPreferenceSchema = createSelectSchema(userPreferences);
export const updateUserPreferenceSchema = createUpdateSchema(userPreferences);
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type SelectUserPreference = z.infer<typeof selectUserPreferenceSchema>;
export type UpdateUserPreference = z.infer<typeof updateUserPreferenceSchema>;
