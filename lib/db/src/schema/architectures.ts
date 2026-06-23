import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { repositoriesTable } from "./repositories";

export const architecturesTable = pgTable("architectures", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositoriesTable.id, { onDelete: "cascade" }),
  components: jsonb("components").notNull().default([]),
  dependencies: jsonb("dependencies").notNull().default([]),
  layers: jsonb("layers").notNull().default([]),
  diagramText: text("diagram_text").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArchitectureSchema = createInsertSchema(architecturesTable).omit({ id: true, createdAt: true });
export type InsertArchitecture = z.infer<typeof insertArchitectureSchema>;
export type Architecture = typeof architecturesTable.$inferSelect;
