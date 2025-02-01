import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileUploadSectionProps {
  files: File[];
  setFiles: (files: File[]) => void;
  maxSize?: number;
}

export function FileUploadSection({ files, setFiles, maxSize = 5 * 1024 * 1024 }: FileUploadSectionProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(file => file.size <= maxSize);
    
    if (validFiles.length < selectedFiles.length) {
      toast.error(`Some files were too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }
    
    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: {maxSize / (1024 * 1024)}MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <span className="text-sm truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
