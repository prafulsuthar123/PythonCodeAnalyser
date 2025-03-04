import { z } from 'zod';

export const languageSchema = z.enum([
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'go',
  'rust'
]);

export const codeAnalysisSchema = z.object({
  code: z.string(),
  language: languageSchema,
  filename: z.string(),
  context: z.object({
    projectRoot: z.string(),
    dependencies: z.record(z.string()).optional(),
    environment: z.record(z.string()).optional()
  }).optional()
});

export const analysisResultSchema = z.object({
  errors: z.array(z.object({
    type: z.string(),
    message: z.string(),
    file: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
    severity: z.enum(['error', 'warning', 'info']).optional()
  })),
  suggestions: z.array(z.object({
    type: z.string(),
    message: z.string(),
    file: z.string(),
    code: z.string().optional(),
    line: z.number().optional(),
    performance_impact: z.string().optional(),
    confidence: z.number().optional()
  })),
  metrics: z.object({
    execution_time: z.number().optional(),
    memory_usage: z.number().optional(),
    complexity: z.number().optional()
  }).optional(),
  execution_output: z.string().optional()
});

export type Language = z.infer<typeof languageSchema>;
export type CodeAnalysis = z.infer<typeof codeAnalysisSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
