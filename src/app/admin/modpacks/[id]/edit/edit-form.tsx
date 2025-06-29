"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Save, Loader2, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FormPageHeader } from "~/components/ui/form-page-header";
import { PageContainer } from "~/components/ui/page-container";

import {
  UpdateModpackSchema,
  type UpdateModpackData,
  type ModpackWithMods,
} from "~/lib/validations/modpack";
import { updateModpack, deleteModpack } from "~/server/actions/modpacks";

interface EditModpackFormProps {
  params: {
    id: string;
  };
  modpack: ModpackWithMods;
}

export function EditModpackForm({ params, modpack }: EditModpackFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UpdateModpackData>({
    resolver: zodResolver(UpdateModpackSchema),
    defaultValues: {
      id: modpack.id,
      name: modpack.name,
      description: modpack.description ?? "",
      version: modpack.version,
      minecraftVersion: modpack.minecraftVersion,
      modLoader: modpack.modLoader,
      modLoaderVersion: modpack.modLoaderVersion ?? "",
      releaseNotes: modpack.releaseNotes ?? "",
      isPublic: modpack.isPublic,
      isFeatured: modpack.isFeatured,
      isActive: modpack.isActive,
    },
  });

  const onSubmit = async (data: UpdateModpackData) => {
    setIsSubmitting(true);
    try {
      const result = await updateModpack(data);

      if (result.success) {
        toast.success("Modpack Updated", {
          description: "Changes have been saved successfully.",
        });
        router.push(`/modpacks/${params.id}`);
      } else {
        toast.error(result.error ?? "Failed to update modpack");
      }
    } catch (error) {
      console.error("Error updating modpack:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteModpack(modpack.id);
      if (result.success) {
        toast.success("Modpack Deleted", {
          description: "The modpack has been removed.",
        });
        router.push("/admin/modpacks");
      } else {
        toast.error("Delete Failed", {
          description: result.error ?? "Unknown error",
        });
      }
    } catch {
      toast.error("Delete Failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer size="large">
      <FormPageHeader
        backHref={`/modpacks/${params.id}`}
        backText="Back to Details"
        icon={<Edit className="h-8 w-8" />}
        title="Edit Modpack"
        description="Update modpack information and settings"
      />

      <div className="mx-auto max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core modpack details and version information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modpack Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Amazing Modpack" {...field} />
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
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0.0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Semantic version number (e.g., 1.2.3)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your modpack..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description of what makes this modpack special
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
                <CardDescription>
                  Minecraft and mod loader compatibility information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="minecraftVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minecraft Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.21" {...field} />
                        </FormControl>
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mod loader" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NEOFORGE">NeoForge</SelectItem>
                            <SelectItem value="FORGE">Forge</SelectItem>
                            <SelectItem value="FABRIC">Fabric</SelectItem>
                            <SelectItem value="QUILT">Quilt</SelectItem>
                            <SelectItem value="VANILLA">Vanilla</SelectItem>
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
                        <FormLabel>Mod Loader Version</FormLabel>
                        <FormControl>
                          <Input placeholder="21.0.167" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional minimum version
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Release Notes</CardTitle>
                <CardDescription>
                  Changelog and update information for this version
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="releaseNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's new in this version..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Markdown formatting is supported
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visibility & Status</CardTitle>
                <CardDescription>
                  Control who can see and download this modpack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Modpack</FormLabel>
                          <FormDescription>
                            Enable this modpack for downloads and display
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Public Modpack</FormLabel>
                          <FormDescription>
                            Allow all users to view and download this modpack
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Modpack</FormLabel>
                          <FormDescription>
                            Highlight this modpack on the main page
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-6">
              <div className="text-muted-foreground text-sm">
                <p>Created by {modpack.createdBy.mcUsername}</p>
                <p>Contains {modpack.mods?.length ?? 0} mods</p>
                <p>
                  File size: {(modpack.fileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              <div className="flex gap-3">
                <Link href={`/modpacks/${params.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSubmitting || isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Modpack
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Modpack</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &ldquo;{modpack.name}
                        &rdquo;? This action cannot be undone and will remove
                        all data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
