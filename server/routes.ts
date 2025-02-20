import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";
import { analysisResultSchema, insertCodeAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeCode } from "./cohere-client";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express) {
  app.post("/api/analyze", async (req, res) => {
    const body = req.body;
    const codeData = z.object({ code: z.string() }).parse(body);

    try {
      // Execute Python code to check for runtime errors
      const { stdout, stderr } = await execAsync(`python3 -c "${codeData.code.replace(/"/g, '\\"')}"`);

      // Get AI analysis from Cohere
      const analysis = await analyzeCode(codeData.code);

      // If there were runtime errors, add them to the analysis
      if (stderr) {
        analysis.errors.push({
          type: "runtime",
          message: stderr,
          line: 1 // Basic line number as runtime errors need more parsing
        });
      }

      // Save analysis
      const result = await storage.saveAnalysis({
        code: codeData.code,
        analysis,
        suggestions: analysis.suggestions,
        improvedCode: analysis.suggestions[0]?.code || codeData.code
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