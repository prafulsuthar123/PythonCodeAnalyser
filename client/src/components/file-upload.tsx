import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import type { FileInput } from "@shared/schema";

interface FileUploadProps {
  onFilesSelected: (files: FileInput[]) => void;
}

export function FileUpload({ onFilesSelected }: FileUploadProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const files: FileInput[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.endsWith('.py')) {
        const content = await file.text();
        files.push({
          name: file.name,
          content: content
        });
      }
    }

    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        multiple
        accept=".py"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={() => document.getElementById('file-upload')?.click()}
        className="w-full sm:w-auto whitespace-nowrap"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload Python Files
      </Button>
    </div>
  );
}