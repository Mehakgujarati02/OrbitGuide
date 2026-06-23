import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { repositoriesTable } from "./repositories";

export const learningPathsTable = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositoriesTable.id, { onDelete: "cascade" }),
  topic: text("topic"),
  steps: jsonb("steps").notNull().default([]),
  totalEstimatedMinutes: integer("total_estimated_minutes").notNull().default(0),
  difficulty: text("difficulty").notNull().default("beginner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLearningPathSchema = createInsertSchema(learningPathsTable).omit({ id: true, createdAt: true });
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type LearningPath = typeof learningPathsTable.$inferSelect;
