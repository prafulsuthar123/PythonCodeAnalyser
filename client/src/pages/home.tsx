import React from 'react';
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CodeEditor } from "@/components/code-editor";
import { AnalysisPanel } from "@/components/analysis-panel";
import { DiffView } from "@/components/diff-view";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult, FileInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { OutputPanel } from "@/components/output-panel";

const DEFAULT_CODE = `def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
result = fibonacci(10)
print(f"The 10th Fibonacci number is: {result}")`;

export default function Home() {
  const [files, setFiles] = useState<FileInput[]>([{ name: 'main.py', content: DEFAULT_CODE }]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (files: FileInput[]) => {
      const res = await apiRequest("POST", "/api/analyze", { files });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: "Code analysis has been completed successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addFile = () => {
    const newFileName = `file${files.length + 1}.py`;
    setFiles([...files, { name: newFileName, content: '' }]);
  };

  const removeFile = (index: number) => {
    if (files.length > 1) {
      setFiles(files.filter((_, i) => i !== index));
    }
  };

  const updateFile = (index: number, content: string) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], content };
    setFiles(newFiles);
  };

  const updateFileName = (index: number, name: string) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], name };
    setFiles(newFiles);
  };

  const handleFilesUploaded = (uploadedFiles: FileInput[]) => {
    setFiles(uploadedFiles);
    toast({
      title: "Files Uploaded",
      description: `Successfully loaded ${uploadedFiles.length} Python file(s).`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Responsive Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-semibold">Python Code Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8 max-w-7xl">
        {/* File Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-medium">Files</h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <FileUpload onFilesSelected={handleFilesUploaded} />
            <Button onClick={addFile} variant="outline" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add New File
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Code Editor Section */}
          <div className="space-y-4">
            {files.map((file, index) => (
              <Card className="p-4 shadow-sm" key={index}>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-4">
                  <input
                    type="text"
                    value={file.name}
                    onChange={(e) => updateFileName(index, e.target.value)}
                    className="border rounded px-2 py-1 flex-1 bg-background w-full sm:w-auto"
                  />
                  {files.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="sm:ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CodeEditor
                  value={file.content}
                  onChange={(content) => updateFile(index, content)}
                  onAnalyze={() => analyzeMutation.mutate(files)}
                  isAnalyzing={analyzeMutation.isPending}
                />
              </Card>
            ))}
          </div>

          {/* Analysis Panel */}
          <Card className="p-4 shadow-sm h-fit">
            <AnalysisPanel 
              analysis={analysis} 
              isAnalyzing={analyzeMutation.isPending}
            />
          </Card>

          {/* Output Panel - Full Width */}
          {analysis && (
            <Card className="p-4 xl:col-span-2 shadow-sm">
              <OutputPanel 
                files={files} 
                analysis={analysis}
                isAnalyzing={analyzeMutation.isPending}
              />
            </Card>
          )}

          {/* Diff View - Full Width */}
          {analysis?.suggestions?.length > 0 && (
            <Card className="p-4 xl:col-span-2 shadow-sm">
              <DiffView files={files} analysis={analysis} />
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}