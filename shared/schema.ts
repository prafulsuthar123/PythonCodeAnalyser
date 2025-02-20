import { pgTable, text, serial, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const codeAnalysis = pgTable("code_analysis", {
  id: serial("id").primaryKey(),
  files: json("files").notNull(), // Array of file contents
  analysis: json("analysis").notNull(),
  suggestions: json("suggestions").notNull(),
  improvedCode: json("improved_code"), // Map of filenames to improved code
  output: json("output").notNull(), // Program output by file
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCodeAnalysisSchema = createInsertSchema(codeAnalysis).pick({
  files: true,
  analysis: true,
  suggestions: true,
  improvedCode: true,
  output: true,
});

export type InsertCodeAnalysis = z.infer<typeof insertCodeAnalysisSchema>;
export type CodeAnalysis = typeof codeAnalysis.$inferSelect;

export const fileSchema = z.object({
  name: z.string(),
  content: z.string(),
});

export const analysisResultSchema = z.object({
  errors: z.array(z.object({
    type: z.string(),
    message: z.string(),
    file: z.string(),
    line: z.number().optional(),
  })),
  suggestions: z.array(z.object({
    type: z.string(),
    message: z.string(),
    file: z.string(),
    code: z.string().optional(),
  })),
  output: z.record(z.string(), z.string()), // File name -> program output
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type FileInput = z.infer<typeof fileSchema>;