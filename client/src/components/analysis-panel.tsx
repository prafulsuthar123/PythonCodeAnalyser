import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Lightbulb, Loader2 } from "lucide-react";
import type { AnalysisResult } from "@shared/schema";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export function AnalysisPanel({ analysis, isAnalyzing }: AnalysisPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Analyzing your code...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Run analysis to see results
      </div>
    );
  }

  const errors = analysis.errors || [];
  const suggestions = analysis.suggestions || [];

  // Group by file
  const fileErrors = errors.reduce((acc, error) => {
    const file = error.file || 'General';
    if (!acc[file]) acc[file] = [];
    acc[file].push(error);
    return acc;
  }, {} as Record<string, typeof errors>);

  const fileSuggestions = suggestions.reduce((acc, suggestion) => {
    const file = suggestion.file || 'General';
    if (!acc[file]) acc[file] = [];
    acc[file].push(suggestion);
    return acc;
  }, {} as Record<string, typeof suggestions>);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analysis Results</h2>

      <ScrollArea className="h-[400px] pr-4">
        <Accordion type="single" collapsible>
          {Object.entries(fileErrors).map(([file, fileErrors]) => (
            <AccordionItem value={`errors-${file}`} key={`errors-${file}`}>
              <AccordionTrigger>
                Errors in {file}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {fileErrors.map((error, i) => (
                    <Alert variant="destructive" key={i}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{error.type}</AlertTitle>
                      <AlertDescription>
                        {error.line ? `Line ${error.line}: ` : ''}{error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          {Object.entries(fileSuggestions).map(([file, fileSuggestions]) => (
            <AccordionItem value={`suggestions-${file}`} key={`suggestions-${file}`}>
              <AccordionTrigger>
                Suggestions for {file}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {fileSuggestions.map((suggestion, i) => (
                    <Alert key={i}>
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>{suggestion.type}</AlertTitle>
                      <AlertDescription>{suggestion.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}