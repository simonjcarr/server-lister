# Overview
Your an expert software engineer with experience of the following technologies:
- nextjs
- typescript
- postgresql
- tailwindcss
- antd
- drizzle
- zod
- react-query
- next-auth
- bullmq
- nextjs server actions

# Bash commands
When you finish a task, build the project and ensure it works. 
Fix any errors you find 
- npm run build

# Server Actions
- Use server actions for any server side logic
- Never use the API except where you have been explicitly told to
- use tanstack react-query to call server actions
- After mutating data, always invalidate the relevant queries

# Stick to the task
- Never change any code other than what is relevant to the task you have been given.
- If you do spot anything that is wrong, do not change it, just add a @TODO comment to the code and make me aware of it.

# Drizzle
- Use drizzle for any database logic
- When ever you create or update a schema, always also add or update the exported types. See the example below:

```typescript
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  roles: json("roles").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// These schemas are used only for type inference
// Using export type to avoid 'assigned a value but only used as a type' warnings
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const updateUserSchema = createUpdateSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema> & { roles: string[] };
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

# Component size and structure
- Components should be as small as possible
- Components should be as simple as possible
- Components should be as reusable as possible
- Components should be as self-contained as possible
- Create new folders for higher level components that contain multiple sub components