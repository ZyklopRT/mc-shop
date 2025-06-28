"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import {
  Upload,
  FileArchive,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  ModpackUploadSchema,
  ModpackUploadClientSchema,
  type ModpackUploadData,
  type ModpackUploadClientData,
} from "~/lib/validations/modpack";
import { useDropzone } from "react-dropzone";

type UploadStage =
  | "idle"
  | "uploading"
  | "processing"
  | "analyzing"
  | "success"
  | "error";

interface ProcessingStatus {
  stage: UploadStage;
  message: string;
  progress: number;
  modsFound?: number;
  errors?: string[];
}

export default function UploadModpackPage() {
  const router = useRouter();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: "idle",
    message: "",
    progress: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<Required<ModpackUploadClientData>>({
    resolver: zodResolver(ModpackUploadClientSchema),
    defaultValues: {
      name: "",
      version: "",
      description: "",
      releaseNotes: "",
      minecraftVersion: "1.21",
      modLoader: "NEOFORGE",
      modLoaderVersion: "",
      isPublic: true,
    },
  });

  // Dropzone setup
  const onDrop = (acceptedFiles: File[]) => {
    setSelectedFile(acceptedFiles[0] ?? null);
  };
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const onSubmit = async (data: Required<ModpackUploadClientData>) => {
    try {
      setProcessingStatus({
        stage: "uploading",
        message: "Uploading modpack file...",
        progress: 10,
      });

      const file = selectedFile;
      if (!file) {
        toast.error("Please select a modpack file to upload");
        return;
      }

      // Validate file type
      if (!file.name.endsWith(".zip")) {
        toast.error("Please upload a ZIP file containing your modpack");
        return;
      }

      // Validate file size (1GB limit)
      const maxSize = 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        toast.error("File size exceeds 1GB limit");
        return;
      }

      setProcessingStatus({
        stage: "processing",
        message: "Processing modpack file...",
        progress: 30,
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", data.name);
      formData.append("version", data.version);
      formData.append("description", data.description);
      formData.append("releaseNotes", data.releaseNotes);
      formData.append("minecraftVersion", data.minecraftVersion);
      formData.append("modLoader", data.modLoader);
      formData.append("modLoaderVersion", data.modLoaderVersion);
      formData.append("isPublic", data.isPublic.toString());

      setProcessingStatus({
        stage: "analyzing",
        message: "Analyzing mods and extracting metadata...",
        progress: 60,
      });

      const response = await fetch("/api/modpacks/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        data?: { modpackId: string; modsFound: number };
        details?: { errors: string[] };
      };

      if (result?.success) {
        setProcessingStatus({
          stage: "success",
          message: "Modpack uploaded successfully!",
          progress: 100,
          modsFound: result.data?.modsFound ?? 0,
        });

        toast.success("Modpack uploaded and processed successfully!");
        setTimeout(() => {
          router.push(`/admin/modpacks/${result.data?.modpackId}`);
        }, 2000);
      } else {
        setProcessingStatus({
          stage: "error",
          message: result?.error ?? "Failed to upload modpack",
          progress: 0,
          errors: result?.details?.errors ?? [],
        });
        toast.error(result?.error ?? "Failed to upload modpack");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setProcessingStatus({
        stage: "error",
        message: "An unexpected error occurred during upload",
        progress: 0,
      });
      toast.error("An unexpected error occurred during upload");
    }
  };

  const isProcessing = ["uploading", "processing", "analyzing"].includes(
    processingStatus.stage,
  );
  const isComplete = processingStatus.stage === "success";
  const hasError = processingStatus.stage === "error";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload Modpack</h1>
          <p className="text-muted-foreground mt-2">
            Upload a ZIP file containing your modpack and we'll automatically
            analyze the mods
          </p>
        </div>

        {/* Processing Status */}
        {processingStatus.stage !== "idle" && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                  {isComplete && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {hasError && <AlertCircle className="h-5 w-5 text-red-600" />}
                  <span className="font-medium">
                    {processingStatus.message}
                  </span>
                </div>
                <Progress
                  value={processingStatus.progress}
                  className="w-full"
                />
                {processingStatus.modsFound && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {processingStatus.modsFound} mods found
                    </Badge>
                  </div>
                )}
                {processingStatus.errors &&
                  processingStatus.errors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {processingStatus.errors.map((error, index) => (
                            <div key={index} className="text-sm">
                              • {error}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Modpack Details</CardTitle>
            <CardDescription>
              Provide information about your modpack and upload the ZIP file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* File Upload (Dropzone) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modpack File *</label>
                  <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
                    onClick={openFileDialog}
                  >
                    <input {...getInputProps()} />
                    <FileArchive className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    {selectedFile ? (
                      <div className="text-sm font-medium text-gray-700">
                        {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span>
                        <span> or drag and drop</span>
                        <p className="mt-1 text-xs text-gray-500">
                          ZIP files up to 1GB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modpack Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="My Awesome Modpack"
                            disabled={isProcessing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1.0.0"
                            disabled={isProcessing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of your modpack..."
                          disabled={isProcessing}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe what makes your modpack unique
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Technical Details */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="minecraftVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minecraft Version</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isProcessing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1.21">1.21</SelectItem>
                            <SelectItem value="1.20.1">1.20.1</SelectItem>
                            <SelectItem value="1.19.2">1.19.2</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modLoader"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mod Loader</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isProcessing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loader" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NEOFORGE">NeoForge</SelectItem>
                            <SelectItem value="FORGE">Forge</SelectItem>
                            <SelectItem value="FABRIC">Fabric</SelectItem>
                            <SelectItem value="QUILT">Quilt</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modLoaderVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loader Version</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="21.0.167"
                            disabled={isProcessing}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Release Notes */}
                <FormField
                  control={form.control}
                  name="releaseNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's new in this version..."
                          disabled={isProcessing}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes about changes in this version
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Settings */}
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Public Access
                        </FormLabel>
                        <FormDescription>
                          Allow all users to download this modpack
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isProcessing}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isProcessing || isComplete}>
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isComplete && <CheckCircle className="mr-2 h-4 w-4" />}
                    <Upload className="mr-2 h-4 w-4" />
                    {isProcessing
                      ? "Processing..."
                      : isComplete
                        ? "Completed"
                        : "Upload Modpack"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
