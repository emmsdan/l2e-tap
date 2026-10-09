import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const demoWorkspaces = pgTable("demo_workspaces", {
  sessionHash: text("session_hash").primaryKey(),
  payload: jsonb("payload").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DemoWorkspace = typeof demoWorkspaces.$inferSelect;
export type NewDemoWorkspace = typeof demoWorkspaces.$inferInsert;
