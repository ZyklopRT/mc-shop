"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "~/lib/i18n/routing";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Check,
  AlertTriangle,
  Info,
  Download,
  ImageIcon,
  Archive,
} from "lucide-react";
import { useZipDropzone, useItemImport, useExampleDownload } from "~/hooks";

export default function ImportItemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Custom hooks for different functionalities
  const { downloadExample } = useExampleDownload();
  const { progress, importResult, isImporting, importFile, clearResult } =
    useItemImport();
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    selectedFile,
  } = useZipDropzone({
    onFilesAccepted: clearResult,
  });

  const handleImport = () => {
    if (selectedFile) {
      void importFile(selectedFile);
    }
  };

  // Check admin access
  if (status === "loading") {
    return (
      <PageWrapper className="max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-64 rounded"></div>
          <div className="bg-muted h-32 w-full rounded"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <PageWrapper className="max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Access denied. This page requires administrator privileges.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-4xl">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Link>
        </Button>

        <div className="mb-2 flex items-center gap-3">
          <Archive className="text-primary h-8 w-8" />
          <h1 className="text-foreground text-3xl font-bold">
            Import Minecraft Items
          </h1>
        </div>
        <p className="text-muted-foreground">
          Upload a ZIP file containing items.json and images to import Minecraft
          items. We&apos;ll handle the image organization for you!
        </p>
      </div>

      {/* Instructions Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Use
          </CardTitle>
          <CardDescription>
            Just create a ZIP file with your items and images - we&apos;ll do
            the rest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold">1. Create your ZIP file</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>
                  • Include <code>items.json</code> with metadata
                </li>
                <li>
                  • Create <code>images/default/</code> folder with PNG images
                </li>
                <li>
                  • Optional: <code>images/sphax/</code> for Sphax textures
                </li>
                <li>• We&apos;ll copy default to sphax if missing!</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExample}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Structure Example
              </Button>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">2. Image naming convention</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>
                  • Format: <code>namespace__item.png</code>
                </li>
                <li>
                  • Example: <code>minecraft__stone.png</code>
                </li>
                <li>
                  • Example: <code>ars_nouveau__source_gem.png</code>
                </li>
                <li>• PNG format recommended</li>
              </ul>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4" />
                <span>Automatic texture management</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="mb-2 text-sm font-semibold">
              ZIP Structure Example:
            </h4>
            <div className="text-muted-foreground space-y-1 font-mono text-xs">
              <div>📦 minecraft-items.zip</div>
              <div>├── 📄 items.json</div>
              <div>└── 📁 images/</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;├── 📁 default/</div>
              <div>
                &nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── 🖼️
                minecraft__stone.png
              </div>
              <div>
                &nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── 🖼️
                minecraft__iron_ingot.png
              </div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 sphax/ (optional)</div>
              <div>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 🖼️
                minecraft__stone.png
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload ZIP File</CardTitle>
          <CardDescription>
            Select or drag and drop your ZIP file containing items and images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : isDragReject
                  ? "border-red-500 bg-red-50"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${isImporting ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />

            {selectedFile ? (
              <div className="space-y-2">
                <Archive className="text-foreground mx-auto h-12 w-12" />
                <div>
                  <p className="text-foreground font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isImporting}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Archive
                  className={`mx-auto h-12 w-12 ${
                    isDragActive
                      ? "text-primary"
                      : isDragReject
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="text-foreground font-medium">
                    {isDragActive
                      ? "Drop the ZIP file here..."
                      : isDragReject
                        ? "Invalid file type. ZIP files only."
                        : "Drop your ZIP file here or click to browse"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Supports ZIP files up to 50MB
                  </p>
                </div>
                {!isDragActive && (
                  <Button variant="outline" disabled={isImporting}>
                    <Upload className="mr-2 h-4 w-4" />
                    Select ZIP File
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Progress Section */}
          {isImporting && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">
                    {progress.currentStep}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {progress.uploadProgress}%
                  </span>
                </div>
                <Progress value={progress.uploadProgress} className="w-full" />
              </div>

              {progress.processing && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Extracting ZIP file, processing items, and organizing
                    images. This may take several minutes for large files.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Import Button */}
          {selectedFile && !isImporting && (
            <div className="mt-6">
              <Button onClick={handleImport} className="w-full" size="lg">
                <Archive className="mr-2 h-4 w-4" />
                Import ZIP File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert
              className={
                importResult.success ? "border-green-200" : "border-red-200"
              }
            >
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>

            {importResult.success &&
              (importResult.imported ?? importResult.updated) && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-foreground text-2xl font-bold">
                      {importResult.total ?? 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Total Items
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.imported ?? 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      New Items
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResult.updated ?? 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Updated Items
                    </div>
                  </div>
                </div>
              )}

            {importResult.errors && importResult.errors.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-foreground mb-2 font-semibold">
                    Errors ({importResult.errors.length})
                  </h4>
                  <div className="bg-muted max-h-32 overflow-y-auto rounded p-2">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-muted-foreground text-sm"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
