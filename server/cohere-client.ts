import { CohereClient } from 'cohere-ai';
import type { AnalysisResult } from '@shared/schema';

// Initialize the Cohere client
const cohereClient = new CohereClient({ 
  token: process.env.COHERE_API_KEY || ''
});

export async function analyzeCode(code: string, filename: string): Promise<AnalysisResult> {
  try {
    const response = await cohereClient.generate({
      model: 'command',
      prompt: `Analyze the following Python code from file "${filename}" and provide detailed feedback including:
1. Code quality assessment
2. Potential bugs or issues
3. Performance considerations
4. Best practice suggestions
5. Improved version of the code if applicable

Code to analyze:
${code}

Provide the analysis in JSON format with the following structure:
{
  "errors": [{"type": string, "message": string, "file": string, "line": number, "severity": "error" | "warning" | "info"}],
  "suggestions": [{"type": string, "message": string, "file": string, "code": string, "line": number}],
  "metrics": {"execution_time": number, "memory_usage": number, "complexity": number}
}`,
      maxTokens: 500,
      temperature: 0.3,
    });

    if (!response.generations?.[0]?.text) {
      return {
        errors: [{ type: 'api', message: 'No response from Cohere API', file: filename, severity: 'error' }],
        suggestions: [],
        metrics: { execution_time: 0, memory_usage: 0, complexity: 0 },
        output: {}
      };
    }

    try {
      const result = JSON.parse(response.generations[0].text);
      return {
        errors: Array.isArray(result.errors) 
          ? result.errors.map((e: any) => ({ ...e, file: filename }))
          : [],
        suggestions: Array.isArray(result.suggestions)
          ? result.suggestions.map((s: any) => ({ ...s, file: filename }))
          : [],
        metrics: result.metrics || { execution_time: 0, memory_usage: 0, complexity: 0 },
        output: {}
      };
    } catch (parseError) {
      return {
        errors: [{ type: 'parsing', message: 'Failed to parse analysis response', file: filename, severity: 'error' }],
        suggestions: [],
        metrics: { execution_time: 0, memory_usage: 0, complexity: 0 },
        output: {}
      };
    }
  } catch (error) {
    console.error('Error analyzing code:', error);
    return {
      errors: [{ type: 'api', message: 'Failed to analyze code using Cohere', file: filename, severity: 'error' }],
      suggestions: [],
      metrics: { execution_time: 0, memory_usage: 0, complexity: 0 },
      output: {}
    };
  }
}