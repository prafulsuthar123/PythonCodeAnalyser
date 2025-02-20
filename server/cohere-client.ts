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
  "errors": [{"type": string, "message": string, "file": string, "line": number}],
  "suggestions": [{"type": string, "message": string, "file": string, "code": string}]
}`,
      maxTokens: 500,
      temperature: 0.3,
    });

    if (!response.generations?.[0]?.text) {
      return {
        errors: [{ type: 'api', message: 'No response from Cohere API', file: filename }],
        suggestions: []
      };
    }

    try {
      const result = JSON.parse(response.generations[0].text);
      return {
        errors: Array.isArray(result.errors) 
          ? result.errors.map(e => ({ ...e, file: filename }))
          : [],
        suggestions: Array.isArray(result.suggestions)
          ? result.suggestions.map(s => ({ ...s, file: filename }))
          : []
      };
    } catch (parseError) {
      return {
        errors: [{ type: 'parsing', message: 'Failed to parse analysis response', file: filename }],
        suggestions: []
      };
    }
  } catch (error) {
    console.error('Error analyzing code:', error);
    return {
      errors: [{ type: 'api', message: 'Failed to analyze code using Cohere', file: filename }],
      suggestions: []
    };
  }
}