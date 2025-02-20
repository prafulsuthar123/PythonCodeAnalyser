import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Lightbulb } from "lucide-react";
import type { AnalysisResult } from "@shared/schema";

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
}

export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Run analysis to see results
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analysis Results</h2>
      
      <ScrollArea className="h-[400px] pr-4">
        {analysis.errors.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Errors</h3>
            {analysis.errors.map((error, i) => (
              <Alert variant="destructive" key={i}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{error.type}</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {analysis.suggestions.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="font-medium">Suggestions</h3>
            {analysis.suggestions.map((suggestion, i) => (
              <Alert key={i}>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>{suggestion.type}</AlertTitle>
                <AlertDescription>{suggestion.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
