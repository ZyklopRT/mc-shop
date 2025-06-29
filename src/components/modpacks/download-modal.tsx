"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Download, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  fileName: string;
  fileSize?: number;
}

export function DownloadModal({
  isOpen,
  onClose,
  downloadUrl,
  fileName,
  fileSize,
}: DownloadModalProps) {
  const [downloadState, setDownloadState] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [progressInterval, setProgressInterval] =
    useState<NodeJS.Timeout | null>(null);

  const startDownload = async () => {
    try {
      setDownloadState("downloading");
      setProgress(0);
      setErrorMessage("");

      // Start fake progress animation to give visual feedback
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slowly progress to 85% over ~12 seconds, then slow down
          if (prev < 50) {
            return prev + 3; // Fast progress initially (0-50% in ~3 seconds)
          } else if (prev < 75) {
            return prev + 1.5; // Medium progress (50-75% in ~8 seconds)
          } else if (prev < 85) {
            return prev + 0.5; // Slower progress (75-85% in ~20 seconds)
          } else {
            return prev + 0.1; // Very slow progress near the end
          }
        });
      }, 200); // Update every 200ms
      setProgressInterval(interval);

      try {
        // Create an AbortController to allow cancellation
        const controller = new AbortController();

        const response = await fetch(downloadUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }

        // Read the response as a blob (simpler since we're faking progress)
        const blob = await response.blob();

        // Clear the fake progress interval
        if (interval) {
          clearInterval(interval);
          setProgressInterval(null);
        }

        // Jump to 100% when download is complete
        setProgress(100);

        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloadState("success");
        toast.success("Download completed successfully!");

        // Auto-close after success
        setTimeout(() => {
          onClose();
          setDownloadState("idle");
        }, 2000);
      } catch (fetchError) {
        // Clear the fake progress interval on error
        if (interval) {
          clearInterval(interval);
          setProgressInterval(null);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Download error:", error);
      setDownloadState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Download failed",
      );
      toast.error("Download failed. Please try again.");
    }
  };

  const handleClose = () => {
    if (downloadState === "downloading") {
      // Don't allow closing during download
      return;
    }

    // Clear any running progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }

    setDownloadState("idle");
    setProgress(0);
    setErrorMessage("");
    onClose();
  };

  const getDialogContent = () => {
    switch (downloadState) {
      case "downloading":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Downloading Modpack
              </DialogTitle>
              <DialogDescription>
                Please wait while we prepare your modpack download...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  Preparing: {fileName}
                </p>
                <Progress value={progress} className="w-full" />
                <p className="text-muted-foreground mt-2 text-xs">
                  {progress.toFixed(1)}% complete
                </p>
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Extracting mods folder... This may take up to 15 seconds for
                large modpacks.
              </p>
            </div>
          </>
        );

      case "success":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Download Complete
              </DialogTitle>
              <DialogDescription>
                Your modpack has been downloaded successfully!
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-sm">
                Check your downloads folder for: <br />
                <span className="bg-muted rounded px-2 py-1 font-mono text-xs">
                  {fileName}
                </span>
              </p>
            </div>
          </>
        );

      case "error":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Download Failed
              </DialogTitle>
              <DialogDescription>
                There was an error downloading your modpack.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-sm text-red-600">{errorMessage}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={startDownload}
                  className="flex-1"
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </>
        );

      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Modpack
              </DialogTitle>
              <DialogDescription>
                Ready to download your modpack?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2 text-center">
                <p className="text-sm">
                  <span className="font-medium">File:</span> {fileName}
                </p>
                {fileSize && (
                  <p className="text-muted-foreground text-sm">
                    <span className="font-medium">Size:</span>{" "}
                    {(fileSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  This will download only the mods folder as a ZIP file.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={startDownload} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Start Download
                </Button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {getDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
