import { pgTable, text, timestamp, serial, index, pgEnum, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from './users';
import { servers } from './servers';

export const CertStatus = pgEnum("status", ["Pending", "Ordered", "Ready"]);

export const certs = pgTable("certs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  requestId: text("request_id"),
  requestedById: text("requested_by_id").references(() => users.id, { onDelete: "set null" }),
  csr: text("csr"),
  cert: text("cert"),
  key: text("key"),
  storagePath: text("storage_path"),
  serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "set null" }),
  primaryDomain: text("primary_domain").notNull(),
  otherDomains: jsonb("other_domains"),
  status: CertStatus().notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("requested_by_idx").on(table.requestedById),
  index("request_id_idx").on(table.requestId),
  index("expires_at_idx").on(table.expiresAt),
]);

export const insertCertSchema = createInsertSchema(certs);
export const selectCertSchema = createSelectSchema(certs);
export const updateCertSchema = createUpdateSchema(certs);
export type InsertCert = z.infer<typeof insertCertSchema>;
export type SelectCert = z.infer<typeof selectCertSchema>;
export type UpdateCert = z.infer<typeof updateCertSchema>;

export type CertRequest = {
  id?: number,
  name: string,
  description?: string | null | undefined,
  primaryDomain: string,
  otherDomains?: { domain: string }[] | null | undefined,
  serverId: number
  status: "Pending" | "Ordered" | "Ready"
};
