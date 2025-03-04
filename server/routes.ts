import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { fileSchema } from "@shared/schema";
import { codeAnalysisSchema } from "@shared/agent-schema";
import { z } from "zod";
import { IDEAgent } from "./services/agent";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import { join } from "path";

const agent = new IDEAgent();

export async function registerRoutes(app: Express) {
  app.post("/api/analyze", async (req, res) => {
    try {
      const body = req.body;
      const filesData = z.object({ files: z.array(fileSchema) }).parse(body);
      
      let combinedAnalysis = {
        errors: [],
        suggestions: [],
        metrics: {
          execution_time: 0,
          memory_usage: 0,
          complexity: 0
        },
        output: {}
      };

      // Analyze each file
      for (const file of filesData.files) {
        const fileAnalysis = await agent.analyzeCode({
          code: file.content,
          language: file.name.endsWith('.py') ? 'python' :
                   file.name.endsWith('.js') ? 'javascript' :
                   file.name.endsWith('.ts') ? 'typescript' :
                   file.name.endsWith('.java') ? 'java' :
                   file.name.endsWith('.cpp') ? 'cpp' :
                   file.name.endsWith('.go') ? 'go' :
                   file.name.endsWith('.rs') ? 'rust' : 'python',
          filename: file.name
        });

        combinedAnalysis.errors.push(...fileAnalysis.errors);
        combinedAnalysis.suggestions.push(...fileAnalysis.suggestions);
        if (fileAnalysis.metrics) {
          combinedAnalysis.metrics.execution_time += fileAnalysis.metrics.execution_time || 0;
          combinedAnalysis.metrics.memory_usage += fileAnalysis.metrics.memory_usage || 0;
          combinedAnalysis.metrics.complexity += fileAnalysis.metrics.complexity || 0;
        }
        if (fileAnalysis.output) {
          combinedAnalysis.output[file.name] = fileAnalysis.output;
        }
      }

      res.json(combinedAnalysis);
    } catch (error) {
      console.error('Error in /api/analyze:', error);
      res.status(400).json({
        errors: [{
          type: 'request_error',
          message: error instanceof Error ? error.message : 'Invalid request',
          file: 'unknown'
        }],
        suggestions: []
      });
    }
  });

  app.post("/api/files", async (req, res) => {
    const body = req.body;
    const filesData = z.object({ files: z.array(fileSchema) }).parse(body);
    
    try {
      const savedFiles = await Promise.all(
        filesData.files.map(async (file) => {
          const key = await storage.put(file.name, file.content);
          return { name: file.name, key };
        })
      );
      
      res.json({ files: savedFiles });
    } catch (error) {
      console.error('Error saving files:', error);
      res.status(500).json({ error: 'Failed to save files' });
    }
  });

  const server = createServer(app);
  return server;
}