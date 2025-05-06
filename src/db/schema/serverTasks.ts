import { pgTable, text, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { servers } from "./servers";
import { users } from "./users";

// Todos: group of tasks for a server
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    isPublic: boolean("isPublic").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  }
);

// Individual task under a todo
export const subTasks = pgTable(
  "sub_tasks",
  {
    id: serial("id").primaryKey(),
    taskId: integer("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    order: integer("order").notNull().default(0),
    description: text("description"),
    isComplete: boolean("isComplete").notNull().default(false),
    assignedTo: text("assignedTo").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  }
);

// Comments on tasks
export const subTaskComments = pgTable(
  "sub_task_comments",
  {
    id: serial("id").primaryKey(),
    subTaskId: integer("subTaskId").notNull().references(() => subTasks.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    mentions: jsonb("mentions").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  }
);

// Define relations for tasks
export const tasksRelations = relations(tasks, ({ many, one }) => ({
  server: one(servers, {
    fields: [tasks.serverId],
    references: [servers.id],
  }),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  subTasks: many(subTasks),
}));

// Define relations for subTasks
export const subTasksRelations = relations(subTasks, ({ one, many }) => ({
  task: one(tasks, {
    fields: [subTasks.taskId],
    references: [tasks.id],
  }),
  assignedUser: one(users, {
    fields: [subTasks.assignedTo],
    references: [users.id],
  }),
  comments: many(subTaskComments),
}));

// Define relations for subTaskComments
export const subTaskCommentsRelations = relations(subTaskComments, ({ one }) => ({
  subTask: one(subTasks, {
    fields: [subTaskComments.subTaskId],
    references: [subTasks.id],
  }),
  user: one(users, {
    fields: [subTaskComments.userId],
    references: [users.id],
  }),
}));

// Zod schemas and TypeScript types
export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
export const updateTaskSchema = createUpdateSchema(tasks);
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SelectTask = z.infer<typeof selectTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export const insertSubTaskSchema = createInsertSchema(subTasks);
export const selectSubTaskSchema = createSelectSchema(subTasks);
export const updateSubTaskSchema = createUpdateSchema(subTasks);
export type InsertSubTask = z.infer<typeof insertSubTaskSchema>;
export type SelectSubTask = z.infer<typeof selectSubTaskSchema>;
export type UpdateSubTask = z.infer<typeof updateSubTaskSchema>;

export const insertSubTaskCommentSchema = createInsertSchema(subTaskComments);
export const selectSubTaskCommentSchema = createSelectSchema(subTaskComments);
export const updateSubTaskCommentSchema = createUpdateSchema(subTaskComments);
export type InsertSubTaskComment = z.infer<typeof insertSubTaskCommentSchema>;
export type SelectSubTaskComment = z.infer<typeof selectSubTaskCommentSchema>;
export type UpdateSubTaskComment = z.infer<typeof updateSubTaskCommentSchema>;
