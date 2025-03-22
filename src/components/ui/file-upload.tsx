import { useState, useRef, useCallback, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  icon?: ReactNode;
  multiple?: boolean;
}

export function FileUpload({
  onFileUpload,
  accept = ".py",
  maxSize = 10, // Increased max size to 10MB
  label = "Upload Bot Files",
  description = "Drag and drop your Discord bot Python files here",
  icon = <i className="fas fa-file-code text-3xl text-secondary"></i>,
  multiple = true // Default to allow multiple files
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    try {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSize}MB`,
          variant: "destructive"
        });
        return;
      }

      // Check file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (accept.includes('.') && !accept.includes(`.${fileExt}`)) {
        toast({
          title: "Invalid file type",
          description: `Only ${accept} files are allowed`,
          variant: "destructive"
        });
        return;
      }

      // Read file content
      const content = await readFileContent(file);
      onFileUpload(file, content);
      
      toast({
        title: "File uploaded",
        description: `${file.name} was successfully uploaded`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive"
      });
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsText(file);
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsProcessing(true);

    try {
      const { files } = e.dataTransfer;
      if (!files || files.length === 0) return;

      // Process multiple files if multiple is true, otherwise just the first one
      if (multiple) {
        for (let i = 0; i < files.length; i++) {
          await processFile(files[i]);
        }
      } else if (files.length > 0) {
        await processFile(files[0]);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [multiple, maxSize, accept, onFileUpload, toast]);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessing(true);
    try {
      const { files } = e.target;
      if (!files || files.length === 0) return;

      // Process multiple files if multiple is true, otherwise just the first one
      if (multiple) {
        for (let i = 0; i < files.length; i++) {
          await processFile(files[i]);
        }
      } else if (files.length > 0) {
        await processFile(files[0]);
      }
    } finally {
      setIsProcessing(false);
      // Reset the input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card
      className={`p-6 border border-dashed border-border transition-all ${
        isDragging ? 'border-secondary bg-secondary/10' : 'hover:border-secondary hover:bg-background-light/50'
      } cursor-pointer relative overflow-hidden`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileInput}
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept={accept}
        multiple={multiple}
      />
      
      {/* Visual feedback during processing */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <i className="fas fa-spinner fa-spin text-2xl text-secondary mb-2"></i>
            <p className="text-sm">Processing file...</p>
          </div>
        </div>
      )}
      
      {/* Upload Icon & Text */}
      <div className="flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4 neon-border blue-glow">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 neon-text">{label}</h3>
        <p className="text-gray-400 mb-4">
          {description}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          {multiple ? 'Upload multiple files' : 'One file at a time'}, max {maxSize}MB
        </p>
        <Button 
          variant="outline" 
          className="border-secondary text-secondary hover:bg-secondary/20"
          onClick={(e) => {
            e.stopPropagation();
            triggerFileInput();
          }}
        >
          <i className="fas fa-upload mr-2"></i>
          {multiple ? 'Browse Files (Multiple)' : 'Browse Files'}
        </Button>
      </div>
    </Card>
  );
}