import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal } from "lucide-react";
import type { AnalysisResult, FileInput } from "@shared/schema";

interface OutputPanelProps {
  files: FileInput[];
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

export function OutputPanel({ files, analysis, isAnalyzing }: OutputPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="text-muted-foreground text-center py-4">
        Running code...
      </div>
    );
  }

  if (!analysis?.output || Object.keys(analysis.output).length === 0) {
    return (
      <div className="text-muted-foreground text-center py-4">
        No output available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Program Output</h2>
      </div>
      
      <Tabs defaultValue={files[0]?.name}>
        <TabsList>
          {files.map(file => (
            <TabsTrigger value={file.name} key={file.name}>
              {file.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {files.map(file => (
          <TabsContent value={file.name} key={file.name}>
            <Card className="bg-muted">
              <ScrollArea className="h-[200px] w-full">
                <pre className="p-4 font-mono text-sm">
                  {analysis.output[file.name] || 'No output'}
                </pre>
              </ScrollArea>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
