import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const repositoriesTable = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  namespace: text("namespace").notNull(),
  description: text("description"),
  defaultBranch: text("default_branch").notNull().default("main"),
  status: text("status").notNull().default("pending"),
  language: text("language"),
  starCount: integer("star_count").notNull().default(0),
  forksCount: integer("forks_count").notNull().default(0),
  summary: text("summary"),
  modules: jsonb("modules").$type<string[]>().notNull().default([]),
  keyServices: jsonb("key_services").$type<string[]>().notNull().default([]),
  techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRepositorySchema = createInsertSchema(repositoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositoriesTable.$inferSelect;
