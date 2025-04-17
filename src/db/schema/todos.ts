import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { servers } from "./servers";
import { users } from "./users";

// Todos: group of tasks for a server
export const todos = pgTable(
  "todos",
  {
    id: serial("id").primaryKey(),
    serverId: integer("serverId").notNull().references(() => servers.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    isPublic: boolean("isPublic").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  }
);

// Individual task under a todo
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    todoId: integer("todoId").notNull().references(() => todos.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    isComplete: boolean("isComplete").notNull().default(false),
    assignedTo: text("assignedTo").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  }
);

// Comments on tasks
export const taskComments = pgTable(
  "task_comments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  }
);

// Zod schemas and TypeScript types
export const insertTodoSchema = createInsertSchema(todos);
export const selectTodoSchema = createSelectSchema(todos);
export const updateTodoSchema = createUpdateSchema(todos);
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type SelectTodo = z.infer<typeof selectTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;

export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
export const updateTaskSchema = createUpdateSchema(tasks);
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SelectTask = z.infer<typeof selectTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export const insertTaskCommentSchema = createInsertSchema(taskComments);
export const selectTaskCommentSchema = createSelectSchema(taskComments);
export const updateTaskCommentSchema = createUpdateSchema(taskComments);
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type SelectTaskComment = z.infer<typeof selectTaskCommentSchema>;
export type UpdateTaskComment = z.infer<typeof updateTaskCommentSchema>;
