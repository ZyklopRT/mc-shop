import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  message?: string;
  imported?: number;
  updated?: number;
  total?: number;
  errors?: string[];
}

interface ImportProgress {
  uploading: boolean;
  processing: boolean;
  uploadProgress: number;
  currentStep: string;
}

export function useItemImport() {
  const [progress, setProgress] = useState<ImportProgress>({
    uploading: false,
    processing: false,
    uploadProgress: 0,
    currentStep: "",
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const clearResult = useCallback(() => {
    setImportResult(null);
  }, []);

  const importFile = useCallback(async (file: File) => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setProgress({
      uploading: true,
      processing: false,
      uploadProgress: 0,
      currentStep: "Uploading ZIP file...",
    });
    setImportResult(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev.uploadProgress >= 90) {
            clearInterval(progressInterval);
            return {
              ...prev,
              uploadProgress: 100,
              processing: true,
              currentStep: "Extracting ZIP and processing items...",
            };
          }
          return {
            ...prev,
            uploadProgress: prev.uploadProgress + 10,
          };
        });
      }, 200);

      const response = await fetch("/api/admin/items/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as ImportResult;

      setProgress({
        uploading: false,
        processing: false,
        uploadProgress: 100,
        currentStep: "Complete",
      });

      setImportResult(result);

      if (result.success) {
        toast.success(result.message ?? "Import completed successfully!");
      } else {
        toast.error(result.message ?? "Import failed");
      }
    } catch (error: unknown) {
      setProgress({
        uploading: false,
        processing: false,
        uploadProgress: 0,
        currentStep: "",
      });

      const errorMessage =
        error instanceof Error ? error.message : "Import failed";
      setImportResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  }, []);

  const isImporting = progress.uploading || progress.processing;

  return {
    progress,
    importResult,
    isImporting,
    importFile,
    clearResult,
  };
}
