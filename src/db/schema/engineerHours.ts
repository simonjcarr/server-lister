import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, serial, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { servers } from "./servers";
import { bookingCodes } from "./bookingCodes";
import { users } from "./users";

export const engineerHours = pgTable(
  "engineer_hours",
  {
    id: serial("id").primaryKey(),
    serverId: integer("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    bookingCodeId: integer("booking_code_id")
      .notNull()
      .references(() => bookingCodes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    minutes: integer("minutes").notNull(),
    note: text("note"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    // Indexes for efficient lookups
    index("engineer_hours_server_id_idx").on(table.serverId),
    index("engineer_hours_booking_code_id_idx").on(table.bookingCodeId),
    index("engineer_hours_user_id_idx").on(table.userId),
    index("engineer_hours_date_idx").on(table.date),
  ]
);

// Create Zod schemas for validation
export const insertEngineerHoursSchema = createInsertSchema(engineerHours);
export const selectEngineerHoursSchema = createSelectSchema(engineerHours);
export const updateEngineerHoursSchema = createUpdateSchema(engineerHours);

// Export TypeScript types derived from the schemas
export type InsertEngineerHours = z.infer<typeof insertEngineerHoursSchema>;
export type SelectEngineerHours = z.infer<typeof selectEngineerHoursSchema>;
export type UpdateEngineerHours = z.infer<typeof updateEngineerHoursSchema>;