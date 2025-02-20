import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";
import { analysisResultSchema, fileSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeCode } from "./cohere-client";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";
import { join } from "path";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express) {
  app.post("/api/analyze", async (req, res) => {
    const body = req.body;
    const filesData = z.object({ files: z.array(fileSchema) }).parse(body);

    try {
      let combinedAnalysis = {
        errors: [],
        suggestions: [],
        output: {} as Record<string, string>
      };

      // Create temporary directory for files
      const tempDir = tmpdir();

      // Write files and execute them
      for (const file of filesData.files) {
        const tempFilePath = join(tempDir, file.name);
        await writeFile(tempFilePath, file.content);

        try {
          const { stdout, stderr } = await execAsync(`python3 "${tempFilePath}"`);
          combinedAnalysis.output[file.name] = stdout || stderr;

          if (stderr) {
            combinedAnalysis.errors.push({
              type: "runtime",
              message: stderr,
              file: file.name,
              line: 1
            });
          }
        } catch (execError: any) {
          combinedAnalysis.errors.push({
            type: "runtime",
            message: execError.message,
            file: file.name,
            line: 1
          });
          combinedAnalysis.output[file.name] = execError.message;
        }

        // Get AI analysis for each file
        const fileAnalysis = await analyzeCode(file.content, file.name);
        combinedAnalysis.errors.push(...fileAnalysis.errors);
        combinedAnalysis.suggestions.push(...fileAnalysis.suggestions);
      }

      // Save analysis
      const result = await storage.saveAnalysis({
        files: filesData.files,
        analysis: combinedAnalysis,
        suggestions: combinedAnalysis.suggestions,
        improvedCode: combinedAnalysis.suggestions.reduce((acc, suggestion) => {
          if (suggestion.file && suggestion.code) {
            acc[suggestion.file] = suggestion.code;
          }
          return acc;
        }, {} as Record<string, string>),
        output: combinedAnalysis.output
      });

      res.json(combinedAnalysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({
        errors: [{ type: "execution", message: errorMessage }],
        suggestions: [],
        output: {}
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}