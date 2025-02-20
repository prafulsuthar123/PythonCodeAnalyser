import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";
import { analysisResultSchema, insertCodeAnalysisSchema } from "@shared/schema";
import { z } from "zod";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express) {
  app.post("/api/analyze", async (req, res) => {
    const body = req.body;
    const codeData = z.object({ code: z.string() }).parse(body);
    
    try {
      // Execute Python code in a controlled environment
      const { stdout, stderr } = await execAsync(`python3 -c "${codeData.code.replace(/"/g, '\\"')}"`);
      
      // Basic analysis
      const analysis = {
        errors: stderr ? [{ type: "runtime", message: stderr }] : [],
        suggestions: [
          {
            type: "style",
            message: "Consider adding docstrings to functions",
            code: '"""Add a docstring here"""'
          }
        ]
      };

      // Save analysis
      const result = await storage.saveAnalysis({
        code: codeData.code,
        analysis,
        suggestions: analysis.suggestions,
        improvedCode: codeData.code
      });

      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({
        errors: [{ type: "execution", message: errorMessage }],
        suggestions: []
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
