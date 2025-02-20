import { Card } from "@/components/ui/card";
import { createTwoFilesPatch } from "diff";
import * as Diff2Html from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";

interface DiffViewProps {
  original: string;
  improved: string;
}

export function DiffView({ original, improved }: DiffViewProps) {
  if (!improved || original === improved) {
    return null;
  }

  const diff = createTwoFilesPatch("original.py", "improved.py", original, improved);
  const diffJson = Diff2Html.parse(diff);
  const diffHtml = Diff2Html.html(diffJson, {
    drawFileList: false,
    matching: "lines",
    outputFormat: "side-by-side",
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Suggested Improvements</h2>
      <Card className="p-4">
        <div
          className="diff-view"
          dangerouslySetInnerHTML={{ __html: diffHtml }}
        />
      </Card>
    </div>
  );
}