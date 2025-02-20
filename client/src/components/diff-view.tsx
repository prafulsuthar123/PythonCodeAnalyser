import { Card } from "@/components/ui/card";
import { createTwoFilesPatch } from "diff";
import * as Diff2Html from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import type { AnalysisResult, FileInput } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiffViewProps {
  files: FileInput[];
  analysis: AnalysisResult;
}

export function DiffView({ files, analysis }: DiffViewProps) {
  const improvementsByFile = analysis.suggestions.reduce((acc, suggestion) => {
    if (suggestion.file && suggestion.code) {
      acc[suggestion.file] = suggestion.code;
    }
    return acc;
  }, {} as Record<string, string>);

  const filesWithImprovements = files.filter(file => 
    improvementsByFile[file.name] && improvementsByFile[file.name] !== file.content
  );

  if (filesWithImprovements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Suggested Improvements</h2>
      <Tabs defaultValue={filesWithImprovements[0]?.name}>
        <TabsList>
          {filesWithImprovements.map(file => (
            <TabsTrigger value={file.name} key={file.name}>
              {file.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {filesWithImprovements.map(file => {
          const diff = createTwoFilesPatch(
            file.name,
            `improved/${file.name}`,
            file.content,
            improvementsByFile[file.name]
          );
          const diffJson = Diff2Html.parse(diff);
          const diffHtml = Diff2Html.html(diffJson, {
            drawFileList: false,
            matching: "lines",
            outputFormat: "side-by-side",
          });

          return (
            <TabsContent value={file.name} key={file.name}>
              <Card className="p-4">
                <div
                  className="diff-view"
                  dangerouslySetInnerHTML={{ __html: diffHtml }}
                />
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}