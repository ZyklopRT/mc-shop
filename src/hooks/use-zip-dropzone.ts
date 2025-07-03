import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface UseZipDropzoneOptions {
  maxSize?: number;
  onFilesAccepted?: (files: File[]) => void;
  onFilesRejected?: () => void;
}

export function useZipDropzone({
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFilesAccepted,
  onFilesRejected,
}: UseZipDropzoneOptions = {}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        toast.success(`Selected file: ${acceptedFiles[0]!.name}`);
        onFilesAccepted?.(acceptedFiles);
      }
    },
    [onFilesAccepted],
  );

  const dropzone = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    maxSize,
    multiple: false,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        toast.error("File size must be less than 50MB");
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        toast.error("Please select a ZIP file");
      } else {
        toast.error("Invalid file. Please select a valid ZIP file.");
      }
      onFilesRejected?.();
    },
  });

  const selectedFile = dropzone.acceptedFiles[0] ?? null;

  return {
    ...dropzone,
    selectedFile,
  };
}
