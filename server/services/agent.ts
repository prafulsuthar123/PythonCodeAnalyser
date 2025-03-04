import { CohereClient } from 'cohere-ai';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { CodeAnalysis, AnalysisResult, Language } from '@shared/agent-schema';

const execFileAsync = promisify(execFile);

export class IDEAgent {
  private cohereClient: CohereClient;
  private executionEnvironments: Map<Language, string>;
  private learningData: Map<string, AnalysisResult[]>;

  constructor() {
    this.cohereClient = new CohereClient({
      token: process.env.COHERE_API_KEY || ''
    });

    // Configure execution environments for different languages
    this.executionEnvironments = new Map([
      ['python', 'python'],
      ['javascript', 'node'],
      ['typescript', 'tsx'],
      ['java', 'java'],
      ['cpp', 'g++'],
      ['go', 'go'],
      ['rust', 'rustc']
    ]);

    this.learningData = new Map();
  }

  async analyzeCode(analysis: CodeAnalysis): Promise<AnalysisResult> {
    try {
      // Step 1: Static Analysis using Cohere
      const staticAnalysis = await this.performStaticAnalysis(analysis);

      // Step 2: Execute Code
      const executionResult = await this.executeCode(analysis);

      // Step 3: Combine and enhance results
      const enhancedResult = await this.enhanceResults(analysis, staticAnalysis, executionResult);

      // Step 4: Learn from results
      this.learnFromAnalysis(analysis.filename, enhancedResult);

      return enhancedResult;
    } catch (error) {
      console.error('Error in code analysis:', error);
      return {
        errors: [{
          type: 'agent_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          file: analysis.filename,
          severity: 'error'
        }],
        suggestions: [],
        metrics: {
          execution_time: 0,
          memory_usage: 0,
          complexity: 0
        }
      };
    }
  }

  private async performStaticAnalysis(analysis: CodeAnalysis): Promise<AnalysisResult> {
    try {
      console.log('Starting static analysis for:', analysis.filename);
      
      const prompt = `You are a code analysis tool. Analyze the following code and provide feedback in the exact format specified below.

CODE:
${analysis.code}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

ERRORS:
- List each error with type, message, severity (error/warning/info), and line number
- One error per line in this format: TYPE: message [SEVERITY] (line NUMBER)
Example: SYNTAX: Missing semicolon [ERROR] (line 5)

SUGGESTIONS:
- List each suggestion with type, message, and line number
- One suggestion per line in this format: TYPE: message (line NUMBER)
Example: STYLE: Use const instead of let (line 3)

METRICS:
COMPLEXITY: 5
MEMORY: 1024
TIME: 100

END
`;

      console.log('Sending request to Cohere API...');
      
      const response = await this.cohereClient.generate({
        prompt,
        model: 'command',
        maxTokens: 1000,
        temperature: 0,
        stopSequences: ['END'],
        returnLikelihoods: 'NONE',
      });

      console.log('Received response from Cohere API');
      
      let analysis_text = response.generations?.[0]?.text;
      
      if (!analysis_text) {
        console.error('No text generated from Cohere API');
        return this.createErrorResult('No analysis generated', analysis.filename);
      }

      // Initialize result with default values
      const result: AnalysisResult = {
        errors: [],
        suggestions: [],
        metrics: { complexity: 0, memory_usage: 0, execution_time: 0 }
      };

      try {
        // Clean up the response text
        analysis_text = analysis_text.trim();
        console.log('Raw analysis text:', analysis_text);

        // More flexible section parsing
        const sections = {
          errors: analysis_text.match(/(?:ERRORS:|TYPE:)([^]*?)(?=SUGGESTIONS:|METRICS:|END|$)/i),
          suggestions: analysis_text.match(/SUGGESTIONS:([^]*?)(?=METRICS:|END|$)/i),
          metrics: analysis_text.match(/METRICS:([^]*?)(?=DESCRIPTION:|END|$)/i)
        };

        // Parse errors section if found
        if (sections.errors && sections.errors[1]) {
          const errorLines = sections.errors[1].trim().split('\n');
          for (const line of errorLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'ERRORS:') continue;
            
            // Handle both bullet point and non-bullet point formats
            const cleanLine = trimmedLine.startsWith('- ') ? trimmedLine.substring(2) : trimmedLine;
            const match = cleanLine.match(/(?:TYPE:\s*)?([^:]+):\s*(.+?)\s*\[(\w+)\]\s*(?:\(line\s*(\d+)\))?/i);
            
            if (match) {
              const [, type, message, severity, lineNum] = match;
              result.errors.push({
                type: type.trim().toLowerCase(),
                message: message.trim(),
                severity: severity.toLowerCase(),
                line: lineNum ? parseInt(lineNum) : undefined,
                file: analysis.filename
              });
            }
          }
        }

        // Parse suggestions section if found
        if (sections.suggestions && sections.suggestions[1]) {
          const suggestionLines = sections.suggestions[1].trim().split('\n');
          for (const line of suggestionLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'SUGGESTIONS:') continue;
            
            // Handle both bullet point and non-bullet point formats
            const cleanLine = trimmedLine.startsWith('- ') ? trimmedLine.substring(2) : trimmedLine;
            const match = cleanLine.match(/(?:TYPE:\s*)?([^:]+):\s*(.+?)\s*\[(\w+)\]\s*(?:\(line\s*(\d+)\))?/i);
            
            if (match) {
              const [, type, message, severity, lineNum] = match;
              result.suggestions.push({
                type: type.trim().toLowerCase(),
                message: message.trim(),
                severity: severity.toLowerCase(),
                line: lineNum ? parseInt(lineNum) : undefined,
                file: analysis.filename
              });
            }
          }
        }

        // Parse metrics section if found
        if (sections.metrics && sections.metrics[1]) {
          const metricsText = sections.metrics[1];
          const complexityMatch = metricsText.match(/COMPLEXITY:\s*(\d+)/i);
          const memoryMatch = metricsText.match(/MEMORY:\s*(\d+)/i);
          const timeMatch = metricsText.match(/TIME:\s*(\d+)/i);

          result.metrics = {
            complexity: complexityMatch ? parseInt(complexityMatch[1]) : 0,
            memory_usage: memoryMatch ? parseInt(memoryMatch[1]) : 0,
            execution_time: timeMatch ? parseInt(timeMatch[1]) : 0
          };
        }

        return result;
      } catch (parseError) {
        console.error('Error parsing analysis response:', parseError);
        console.error('Response content:', analysis_text);
        return this.createErrorResult(`Error parsing analysis: ${parseError.message}`, analysis.filename);
      }
    } catch (error) {
      console.error('Error in static analysis:', error);
      return this.createErrorResult(error.message, analysis.filename);
    }
  }

  private createErrorResult(message: string, filename: string): AnalysisResult {
    return {
      errors: [{
        type: 'analysis_error',
        message,
        file: filename,
        severity: 'error'
      }],
      suggestions: [],
      metrics: { complexity: 0, memory_usage: 0, execution_time: 0 }
    };
  }

  private async executeCode(analysis: CodeAnalysis): Promise<{
    output: string;
    execution_time: number;
    memory_usage: number;
  }> {
    const executor = this.executionEnvironments.get(analysis.language);
    if (!executor) {
      throw new Error(`Unsupported language: ${analysis.language}`);
    }

    const tmpDir = await this.createTempDir();
    const filename = this.getExecutableFilename(analysis.filename, analysis.language);
    const filepath = join(tmpDir, filename);

    await writeFile(filepath, analysis.code);

    const startTime = process.hrtime();
    const { stdout, stderr } = await execFileAsync(executor, [filepath]);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    
    return {
      output: stdout || stderr,
      execution_time: seconds + nanoseconds / 1e9,
      memory_usage: process.memoryUsage().heapUsed
    };
  }

  private async enhanceResults(
    analysis: CodeAnalysis,
    staticAnalysis: AnalysisResult,
    executionResult: { output: string; execution_time: number; memory_usage: number }
  ): Promise<AnalysisResult> {
    console.log('Enhancing results with execution data:', executionResult);
    
    // Start with the static analysis result
    const result = { ...staticAnalysis };
    
    // Add execution metrics
    result.metrics = {
      ...result.metrics,
      execution_time: executionResult.execution_time,
      memory_usage: executionResult.memory_usage
    };
    
    // Add execution output
    result.output = executionResult.output;
    
    // If there was an error in execution, add it to errors
    if (executionResult.output && executionResult.output.toLowerCase().includes('error')) {
      result.errors.push({
        type: 'RUNTIME',
        message: executionResult.output,
        severity: 'error',
        line: 0  // Runtime errors may not have a specific line number
      });
    }
    
    return result;
  }

  private learnFromAnalysis(filename: string, result: AnalysisResult): void {
    if (!this.learningData.has(filename)) {
      this.learningData.set(filename, []);
    }
    this.learningData.get(filename)?.push(result);

    // Implement pattern recognition and suggestion improvement here
    // This is a placeholder for future machine learning integration
  }

  private async createTempDir(): Promise<string> {
    const dir = join(tmpdir(), 'ide-agent-' + Date.now());
    await mkdir(dir, { recursive: true });
    return dir;
  }

  private getExecutableFilename(filename: string, language: Language): string {
    const base = filename.split('.')[0];
    switch (language) {
      case 'python': return `${base}.py`;
      case 'javascript': return `${base}.js`;
      case 'typescript': return `${base}.ts`;
      case 'java': return `${base}.java`;
      case 'cpp': return `${base}.cpp`;
      case 'go': return `${base}.go`;
      case 'rust': return `${base}.rs`;
      default: return filename;
    }
  }
}
