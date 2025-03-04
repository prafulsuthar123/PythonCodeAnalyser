import React, { useState } from 'react';
import { Editor, OnMount } from '@monaco-editor/react';
import type { CodeAnalysis, AnalysisResult, Language } from '@shared/agent-schema';

interface CodeAnalyzerProps {
  defaultLanguage?: Language;
  defaultCode?: string;
}

export function CodeAnalyzer({ defaultLanguage = 'python', defaultCode = '' }: CodeAnalyzerProps) {
  const [code, setCode] = useState<string>(defaultCode);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const analyzeCode = async () => {
    if (!code.trim()) {
      setAnalysis({
        errors: [{
          type: 'validation',
          message: 'Please enter some code to analyze',
          file: `code.${language}`,
          severity: 'error'
        }],
        suggestions: [],
        metrics: {
          execution_time: 0,
          memory_usage: 0,
          complexity: 0
        }
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          filename: `code.${language}`,
        } satisfies CodeAnalysis),
      });

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing code:', error);
      setAnalysis({
        errors: [{
          type: 'api',
          message: 'Failed to analyze code. Please try again.',
          file: `code.${language}`,
          severity: 'error'
        }],
        suggestions: [],
        metrics: {
          execution_time: 0,
          memory_usage: 0,
          complexity: 0
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="px-3 py-2 border rounded"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </select>
        <button
          onClick={analyzeCode}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </div>

      <div className="h-[400px] border rounded">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {analysis && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
          
          {analysis.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-600">Errors</h4>
              <ul className="list-disc pl-5">
                {analysis.errors.map((error, i) => (
                  <li key={i} className="text-red-600">
                    {error.message}
                    {error.line && ` (Line ${error.line})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-blue-600">Suggestions</h4>
              <ul className="list-disc pl-5">
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-blue-600">
                    {suggestion.message}
                    {suggestion.code && (
                      <pre className="mt-2 p-2 bg-gray-100 rounded">
                        <code>{suggestion.code}</code>
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.metrics && (
            <div className="mb-4">
              <h4 className="font-medium">Metrics</h4>
              <ul className="list-none pl-5">
                {analysis.metrics.execution_time !== undefined && (
                  <li>Execution Time: {analysis.metrics.execution_time.toFixed(3)}s</li>
                )}
                {analysis.metrics.memory_usage !== undefined && (
                  <li>Memory Usage: {Math.round(analysis.metrics.memory_usage / 1024 / 1024)}MB</li>
                )}
                {analysis.metrics.complexity !== undefined && (
                  <li>Complexity Score: {analysis.metrics.complexity}</li>
                )}
              </ul>
            </div>
          )}

          {analysis.execution_output && (
            <div className="mb-4">
              <h4 className="font-medium">Execution Output</h4>
              <pre className="p-2 bg-gray-100 rounded">
                <code>{analysis.execution_output}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
