import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayIcon, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function CodeEditor({ value, onChange, onAnalyze, isAnalyzing }: CodeEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Code Editor</h2>
        <Button onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayIcon className="mr-2 h-4 w-4" />
          )}
          {isAnalyzing ? "Analyzing..." : "Analyze Code"}
        </Button>
      </div>

      <Card className="border-2 min-h-[400px]">
        <Editor
          height="400px"
          defaultLanguage="python"
          value={value}
          onChange={(val) => onChange(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly: isAnalyzing,
          }}
        />
      </Card>
    </div>
  );
}