import { Card } from "@/components/ui/card";
import { createTwoFilesPatch } from "diff";
import { parse } from "diff2html";
import { html } from "diff2html/lib/ui/js/diff2html-ui-base.js";

interface DiffViewProps {
  original: string;
  improved: string;
}

export function DiffView({ original, improved }: DiffViewProps) {
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
