import { z } from "zod";

// Enums matching the database schema
export const ModLoaderSchema = z.enum([
  "NEOFORGE",
  "FORGE",
  "FABRIC",
  "QUILT",
  "VANILLA",
]);

export const ModSideSchema = z.enum(["CLIENT", "SERVER", "BOTH"]);

export const ChangeTypeSchema = z.enum([
  "ADDED",
  "UPDATED",
  "REMOVED",
  "UNCHANGED",
]);

export const ChangeImpactSchema = z.enum(["MAJOR", "MINOR", "PATCH"]);

// Core modpack schemas
export const CreateModpackSchema = z.object({
  name: z
    .string()
    .min(1, "Modpack name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  version: z
    .string()
    .min(1, "Version is required")
    .max(50, "Version must be less than 50 characters"),
  minecraftVersion: z.string().default("1.21"),
  modLoader: ModLoaderSchema.default("NEOFORGE"),
  modLoaderVersion: z.string().optional(),
  releaseNotes: z.string().optional(),
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateModpackSchema = CreateModpackSchema.partial().extend({
  id: z.string().cuid(),
});

export const ModpackUploadSchema = z.object({
  file: z.any(), // Will be validated as File in the component
  name: z.string().min(1, "Modpack name is required"),
  version: z.string().min(1, "Version is required"),
  description: z.string().optional(),
  releaseNotes: z.string().optional(),
  minecraftVersion: z.string().default("1.21"),
  modLoader: ModLoaderSchema.default("NEOFORGE"),
  modLoaderVersion: z.string().optional(),
  isPublic: z.boolean().default(true),
});

// Client-side schema for upload form (no file field)
export const ModpackUploadClientSchema = z.object({
  name: z.string().min(1, "Modpack name is required"),
  version: z.string().min(1, "Version is required"),
  description: z.string(),
  releaseNotes: z.string(),
  minecraftVersion: z.string(),
  modLoader: ModLoaderSchema,
  modLoaderVersion: z.string(),
  isPublic: z.boolean(),
});
export type ModpackUploadClientData = z.infer<typeof ModpackUploadClientSchema>;

export const ModMetadataSchema = z.object({
  modId: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  version: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
  homepage: z.string().url().optional(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  checksum: z.string(),
  modLoader: ModLoaderSchema,
  modLoaderVersion: z.string().optional(),
  minecraftVersion: z.string().optional(),
  side: ModSideSchema.default("BOTH"),
  dependencies: z.any().optional(), // JSON field
});

export const ModpackSearchSchema = z.object({
  query: z.string().optional(),
  modLoader: ModLoaderSchema.optional(),
  minecraftVersion: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const VersionComparisonSchema = z.object({
  version1: z.string(),
  version2: z.string(),
  modpackName: z.string(),
});

export const ModpackDownloadSchema = z.object({
  modpackId: z.string().cuid(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// Response schemas for type safety
export const ModpackInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  version: z.string(),
  minecraftVersion: z.string(),
  modLoader: ModLoaderSchema,
  modLoaderVersion: z.string().nullable(),
  releaseDate: z.date(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isPublic: z.boolean(),
  downloadCount: z.number(),
  fileSize: z.number(),
  checksum: z.string(),
  releaseNotes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.object({
    id: z.string(),
    mcUsername: z.string(),
  }),
  _count: z
    .object({
      mods: z.number(),
    })
    .optional(),
});

export const ModInfoSchema = z.object({
  id: z.string(),
  modId: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  version: z.string(),
  author: z.string().nullable(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  logoPath: z.string().nullable(),
  fileName: z.string(),
  fileSize: z.number(),
  checksum: z.string(),
  modLoader: ModLoaderSchema,
  modLoaderVersion: z.string().nullable(),
  minecraftVersion: z.string().nullable(),
  side: ModSideSchema,
  dependencies: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ModpackWithModsSchema = ModpackInfoSchema.extend({
  mods: z.array(ModInfoSchema),
});

export const ModpackListResponseSchema = z.object({
  modpacks: z.array(ModpackInfoSchema),
  totalCount: z.number(),
  hasMore: z.boolean(),
});

export const ChangelogEntrySchema = z.object({
  id: z.string(),
  changeType: ChangeTypeSchema,
  modId: z.string(),
  modName: z.string(),
  oldVersion: z.string().nullable(),
  newVersion: z.string().nullable(),
  description: z.string().nullable(),
  impact: ChangeImpactSchema,
});

export const ChangelogDataSchema = z.object({
  changes: z.array(ChangelogEntrySchema),
  summary: z.object({
    added: z.number(),
    updated: z.number(),
    removed: z.number(),
    unchanged: z.number(),
  }),
});

// AI-Generated Summary Schemas
export const ModpackUpdateCategorySchema = z.enum([
  "MAGIC",
  "TECHNOLOGY",
  "ADVENTURE",
  "EXPLORATION",
  "BUILDING",
  "UTILITY",
  "OPTIMIZATION",
  "COSMETIC",
  "GAMEPLAY",
  "PERFORMANCE",
  "CONTENT",
  "BUGFIX",
  "MIXED",
]);

export const AIGeneratedSummarySchema = z.object({
  focus: z
    .string()
    .describe(
      "What this update focuses on in German (e.g., 'Magie und Abenteuer', 'Technologie und Bauen')",
    ),
  description: z
    .string()
    .describe("A 1-2 sentence description of what the update brings in German"),
  categories: z
    .array(ModpackUpdateCategorySchema)
    .describe("Primary categories this update focuses on"),
  highlights: z
    .array(z.string())
    .describe("2-4 key highlights or notable additions/changes in German"),
  impact: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .describe("Overall impact level of this update"),
});

export const ChangelogWithAISummarySchema = ChangelogDataSchema.extend({
  aiSummary: AIGeneratedSummarySchema.optional(),
});

// Type exports
export type ModLoader = z.infer<typeof ModLoaderSchema>;
export type ModSide = z.infer<typeof ModSideSchema>;
export type ChangeType = z.infer<typeof ChangeTypeSchema>;
export type ChangeImpact = z.infer<typeof ChangeImpactSchema>;

export type CreateModpackData = z.infer<typeof CreateModpackSchema>;
export type UpdateModpackData = z.infer<typeof UpdateModpackSchema>;
export type ModpackUploadData = z.infer<typeof ModpackUploadSchema>;
export type ModMetadata = z.infer<typeof ModMetadataSchema>;
export type ModpackSearchData = z.infer<typeof ModpackSearchSchema>;
export type VersionComparisonData = z.infer<typeof VersionComparisonSchema>;
export type ModpackDownloadData = z.infer<typeof ModpackDownloadSchema>;

export type ModpackInfo = z.infer<typeof ModpackInfoSchema>;
export type ModInfo = z.infer<typeof ModInfoSchema>;
export type ModpackWithMods = z.infer<typeof ModpackWithModsSchema>;
export type ModpackListResponse = z.infer<typeof ModpackListResponseSchema>;
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;
export type ChangelogData = z.infer<typeof ChangelogDataSchema>;

// Enhanced upload schema that supports adding versions to existing modpacks
export const ModpackVersionUploadSchema = z.object({
  file: z.any(), // Will be validated as File in the component
  existingModpackName: z.string().optional(), // If adding to existing modpack
  name: z.string().min(1, "Modpack name is required"),
  version: z.string().min(1, "Version is required"),
  description: z.string().optional(),
  releaseNotes: z.string().optional(),
  minecraftVersion: z.string().default("1.21"),
  modLoader: ModLoaderSchema.default("NEOFORGE"),
  modLoaderVersion: z.string().optional(),
  isPublic: z.boolean().default(true),
});

// Client-side schema for enhanced upload form
export const ModpackVersionUploadClientSchema = z.object({
  existingModpackName: z.string().optional(),
  name: z.string().min(1, "Modpack name is required"),
  version: z.string().min(1, "Version is required"),
  description: z.string().optional(),
  releaseNotes: z.string().optional(),
  minecraftVersion: z.string().optional(),
  modLoader: ModLoaderSchema.optional(),
  modLoaderVersion: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Type for the form that handles the optional field properly
export type ModpackVersionUploadClientForm = z.infer<
  typeof ModpackVersionUploadClientSchema
>;

// New type for modpack with versions grouped
export const ModpackGroupSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  totalVersions: z.number(),
  latestVersion: ModpackInfoSchema,
  allVersions: z.array(ModpackInfoSchema),
  totalDownloads: z.number(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isPublic: z.boolean(),
});

export const ModpackGroupListSchema = z.object({
  modpackGroups: z.array(ModpackGroupSchema),
  totalCount: z.number(),
  hasMore: z.boolean(),
});

// Export types
export type ModpackVersionUploadData = z.infer<
  typeof ModpackVersionUploadSchema
>;
export type ModpackVersionUploadClientData = z.infer<
  typeof ModpackVersionUploadClientSchema
>;
export type ModpackGroup = z.infer<typeof ModpackGroupSchema>;
export type ModpackGroupList = z.infer<typeof ModpackGroupListSchema>;

// AI-related type exports
export type ModpackUpdateCategory = z.infer<typeof ModpackUpdateCategorySchema>;
export type AIGeneratedSummary = z.infer<typeof AIGeneratedSummarySchema>;
export type ChangelogWithAISummary = z.infer<
  typeof ChangelogWithAISummarySchema
>;
