import { z } from "zod";

// Search type enum
export const SEARCH_TYPES = {
  PLAYER: "player",
  ITEM: "item",
  AUTO: "auto", // Auto-detect search type
} as const;

// Unified search schema
export const unifiedSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Query too long"),
  type: z
    .enum([SEARCH_TYPES.PLAYER, SEARCH_TYPES.ITEM, SEARCH_TYPES.AUTO])
    .default(SEARCH_TYPES.AUTO),
  limit: z.number().int().min(1).max(20).default(10),
  language: z.enum(["en", "de"]).default("en"),
});

// Player search schema
export const playerSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Player name is required")
    .max(50, "Player name too long"),
  limit: z.number().int().min(1).max(10).default(5),
});

// Item search schema
export const itemSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Item search query is required")
    .max(100, "Query too long"),
  language: z.enum(["en", "de"]).default("en"),
  limit: z.number().int().min(1).max(20).default(10),
  includeShops: z.boolean().default(true), // Whether to include shops that sell this item
});

// Type exports
export type UnifiedSearchData = z.infer<typeof unifiedSearchSchema>;
export type PlayerSearchData = z.infer<typeof playerSearchSchema>;
export type ItemSearchData = z.infer<typeof itemSearchSchema>;
