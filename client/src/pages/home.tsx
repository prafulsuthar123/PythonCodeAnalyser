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

export default function Home() {
  const [files, setFiles] = useState<FileInput[]>([{ name: 'main.py', content: '' }]);
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
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <h1 className="text-xl font-semibold">Python Code Analyzer</h1>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-screen-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Files</h2>
          <div className="flex gap-2">
            <FileUpload onFilesSelected={handleFilesUploaded} />
            <Button onClick={addFile} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New File
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {files.map((file, index) => (
              <Card className="p-4 shadow-sm" key={index}>
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    value={file.name}
                    onChange={(e) => updateFileName(index, e.target.value)}
                    className="border rounded px-2 py-1 flex-1 mr-2 bg-background"
                  />
                  {files.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
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

          <Card className="p-4 shadow-sm">
            <AnalysisPanel 
              analysis={analysis} 
              isAnalyzing={analyzeMutation.isPending}
            />
          </Card>

          {analysis?.suggestions?.length > 0 && (
            <Card className="p-4 lg:col-span-2 shadow-sm">
              <DiffView files={files} analysis={analysis} />
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}