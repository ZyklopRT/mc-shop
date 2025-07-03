import { z } from "zod";

// Schema for individual item in JSON import
export const importItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  name_en: z.string().min(1, "English name is required"),
  name_de: z.string().min(1, "German name is required"),
  filename: z.string().min(1, "Filename is required"),
});

// Schema for JSON file import
export const importItemsSchema = z
  .array(importItemSchema)
  .min(1, "At least one item is required");

// File-like object type for server-side validation
type FileObject = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

// Schema for ZIP file upload - server-side validation
function isValidFileObject(file: unknown): file is FileObject {
  return Boolean(
    file &&
      typeof file === "object" &&
      "name" in file &&
      "type" in file &&
      "size" in file &&
      "arrayBuffer" in file,
  );
}

export const zipUploadSchema = z.object({
  file: z
    .custom<FileObject>(isValidFileObject, "Invalid file object")
    .refine(
      (file) =>
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.name.endsWith(".zip"),
      "File must be a ZIP file",
    )
    .refine(
      (file) => file.size <= 50 * 1024 * 1024, // 50MB limit for ZIP files
      "File size must be less than 50MB",
    ),
});

// Types
export type ImportItem = z.infer<typeof importItemSchema>;
export type ImportItemsData = z.infer<typeof importItemsSchema>;
export type ZipUploadData = z.infer<typeof zipUploadSchema>;

// Admin role validation
export const adminActionSchema = z.object({
  requireAdmin: z.boolean().default(true),
});

export type AdminActionData = z.infer<typeof adminActionSchema>;
