import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CodeEditor } from "@/components/code-editor";
import { AnalysisPanel } from "@/components/analysis-panel";
import { DiffView } from "@/components/diff-view";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@shared/schema";

export default function Home() {
  const [code, setCode] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/analyze", { code });
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Python Code Analyzer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <CodeEditor
              value={code}
              onChange={setCode}
              onAnalyze={() => analyzeMutation.mutate(code)}
            />
          </Card>

          <Card className="p-4">
            <AnalysisPanel analysis={analysis} />
          </Card>

          {analysis?.suggestions.length > 0 && (
            <Card className="p-4 lg:col-span-2">
              <DiffView original={code} improved={analysis.suggestions[0].code || code} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
