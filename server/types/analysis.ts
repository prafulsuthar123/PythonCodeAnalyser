export interface AnalysisResult {
  errors: Array<{
    type: string;
    message: string;
    severity: string;
    line?: number;
  }>;
  suggestions: Array<{
    type: string;
    message: string;
    line?: number;
  }>;
  metrics: {
    execution_time: number;
    memory_usage: number;
    complexity: number;
  };
  output: { [filename: string]: string };  // Change to store output by filename
}
