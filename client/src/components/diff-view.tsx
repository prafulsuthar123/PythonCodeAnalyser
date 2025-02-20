import { Card } from "@/components/ui/card";
import { createTwoFilesPatch } from "diff";
import { html } from "diff2html/lib/ui/js/diff2html-ui-base.js";
import { parse } from "diff2html";

interface DiffViewProps {
  original: string;
  improved: string;
}

export function DiffView({ original, improved }: DiffViewProps) {
  if (!improved || original === improved) {
    return null;
  }

  const diff = createTwoFilesPatch("original.py", "improved.py", original, improved);
  const diffJson = parse(diff);
  const diffHtml = html(diffJson, {
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