"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  PackageOpen,
  Plus,
} from "lucide-react";
import { FormPageHeader } from "~/components/ui/form-page-header";
import { PageContainer } from "~/components/ui/page-container";
import {
  ModpackVersionUploadClientSchema,
  type ModpackVersionUploadClientForm,
} from "~/lib/validations/modpack";
import { useDropzone } from "react-dropzone";
import {
  getExistingModpackNames,
  suggestNextVersion,
} from "~/server/actions/modpacks/versions";

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
  const searchParams = useSearchParams();
  const existingModpackParam = searchParams.get("existing");

  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: "idle",
    message: "",
    progress: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingModpacks, setExistingModpacks] = useState<string[]>([]);
  const [selectedExistingModpack, setSelectedExistingModpack] =
    useState<string>("");
  const [isNewModpack, setIsNewModpack] = useState(true);

  const form = useForm<ModpackVersionUploadClientForm>({
    resolver: zodResolver(ModpackVersionUploadClientSchema),
    defaultValues: {
      existingModpackName: "",
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

  // Load existing modpack names on component mount
  useEffect(() => {
    async function loadExistingModpacks() {
      try {
        const result = await getExistingModpackNames();
        if (result.success && result.data) {
          setExistingModpacks(result.data);

          // Auto-select modpack if specified in URL
          if (
            existingModpackParam &&
            result.data.includes(existingModpackParam)
          ) {
            setIsNewModpack(false);
            setSelectedExistingModpack(existingModpackParam);
            form.setValue("existingModpackName", existingModpackParam);
          }
        }
      } catch (error) {
        console.error("Failed to load existing modpacks:", error);
      }
    }
    void loadExistingModpacks();
  }, [existingModpackParam, form]);

  // Auto-suggest version when existing modpack is selected
  useEffect(() => {
    async function handleExistingModpackChange() {
      if (selectedExistingModpack) {
        try {
          const result = await suggestNextVersion(selectedExistingModpack);
          if (result.success && result.data) {
            form.setValue("version", result.data);
            form.setValue("name", selectedExistingModpack);
            form.setValue("existingModpackName", selectedExistingModpack);
          }
        } catch (error) {
          console.error("Failed to suggest next version:", error);
        }
      }
    }
    void handleExistingModpackChange();
  }, [selectedExistingModpack, form]);

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

  const onSubmit = async (data: ModpackVersionUploadClientForm) => {
    try {
      setProcessingStatus({
        stage: "uploading",
        message: "Uploading modpack file...",
        progress: 10,
      });

      // Check if file is valid
      const file = selectedFile ?? null;
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
      formData.append("existingModpackName", data.existingModpackName ?? "");
      formData.append("name", data.name);
      formData.append("version", data.version);
      formData.append("description", data.description ?? "");
      formData.append("releaseNotes", data.releaseNotes ?? "");
      formData.append("minecraftVersion", data.minecraftVersion ?? "1.21");
      formData.append("modLoader", data.modLoader ?? "NEOFORGE");
      formData.append("modLoaderVersion", data.modLoaderVersion ?? "");
      formData.append("isPublic", (data.isPublic ?? true).toString());

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
          router.push(`/modpacks/${result.data?.modpackId}`);
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
    <PageContainer size="medium">
      <FormPageHeader
        backHref="/admin/modpacks"
        backText="Back to Modpacks"
        icon={<Upload className="h-8 w-8" />}
        title="Upload Modpack"
        description="Upload a ZIP file containing your modpack and we'll automatically analyze the mods"
      />

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
                <span className="font-medium">{processingStatus.message}</span>
              </div>
              <Progress value={processingStatus.progress} className="w-full" />
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
            Create a new modpack or add a version to an existing one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Modpack Type Selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    type="button"
                    variant={isNewModpack ? "default" : "outline"}
                    className="h-auto p-4"
                    onClick={() => {
                      setIsNewModpack(true);
                      setSelectedExistingModpack("");
                      form.setValue("existingModpackName", "");
                      form.setValue("name", "");
                      form.setValue("version", "");
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Plus className="h-6 w-6" />
                      <span className="font-medium">New Modpack</span>
                      <span className="text-muted-foreground text-xs">
                        Create a brand new modpack
                      </span>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant={!isNewModpack ? "default" : "outline"}
                    className="h-auto p-4"
                    onClick={() => {
                      setIsNewModpack(false);
                      form.setValue("existingModpackName", "");
                    }}
                    disabled={existingModpacks.length === 0}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <PackageOpen className="h-6 w-6" />
                      <span className="font-medium">Add Version</span>
                      <span className="text-muted-foreground text-xs">
                        Add to existing modpack
                      </span>
                    </div>
                  </Button>
                </div>

                {/* Existing Modpack Selection */}
                {!isNewModpack && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Existing Modpack
                    </label>
                    <Select
                      value={selectedExistingModpack}
                      onValueChange={setSelectedExistingModpack}
                      disabled={isProcessing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an existing modpack" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingModpacks.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedExistingModpack && (
                      <p className="text-muted-foreground text-sm">
                        A new version will be added to &quot;
                        {selectedExistingModpack}&quot;
                      </p>
                    )}
                  </div>
                )}
              </div>

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
                          disabled={isProcessing || !isNewModpack}
                          {...field}
                        />
                      </FormControl>
                      {!isNewModpack && (
                        <FormDescription>
                          Name is inherited from selected modpack
                        </FormDescription>
                      )}
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
                      {!isNewModpack && selectedExistingModpack && (
                        <FormDescription>
                          Auto-suggested based on existing versions
                        </FormDescription>
                      )}
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
                      <FormLabel className="text-base">Public Access</FormLabel>
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
              <div className="flex justify-end gap-3">
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
                      : !isNewModpack && selectedExistingModpack
                        ? `Add Version to ${selectedExistingModpack}`
                        : "Upload Modpack"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
