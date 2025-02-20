import { pgTable, text, serial, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const codeAnalysis = pgTable("code_analysis", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  analysis: json("analysis").notNull(),
  suggestions: json("suggestions").notNull(),
  improvedCode: text("improved_code"),
});

export const insertCodeAnalysisSchema = createInsertSchema(codeAnalysis).pick({
  code: true,
  analysis: true,
  suggestions: true,
  improvedCode: true,
});

export type InsertCodeAnalysis = z.infer<typeof insertCodeAnalysisSchema>;
export type CodeAnalysis = typeof codeAnalysis.$inferSelect;

export const analysisResultSchema = z.object({
  errors: z.array(z.object({
    type: z.string(),
    message: z.string(),
    line: z.number().optional(),
  })),
  suggestions: z.array(z.object({
    type: z.string(),
    message: z.string(),
    code: z.string().optional(),
  })),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
