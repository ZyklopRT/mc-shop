import { z } from "zod";

// Shop validation schemas
export const createShopSchema = z.object({
  name: z
    .string()
    .min(1, "Shop name is required")
    .max(100, "Shop name too long"),
  description: z.string().max(500, "Description too long").optional(),
  locationX: z.number().int().optional(),
  locationY: z.number().int().optional(),
  locationZ: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateShopSchema = z.object({
  shopId: z.string().cuid("Invalid shop ID"),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  locationX: z.number().int().optional(),
  locationY: z.number().int().optional(),
  locationZ: z.number().int().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  isActive: z.boolean().optional(),
});

export const deleteShopSchema = z.object({
  shopId: z.string().cuid("Invalid shop ID"),
});

// Currency options for shop items
export const CURRENCY_TYPES = {
  EMERALDS: "emeralds",
  EMERALD_BLOCKS: "emerald_blocks",
} as const;

export const currencyDisplayNames = {
  [CURRENCY_TYPES.EMERALDS]: "Emeralds",
  [CURRENCY_TYPES.EMERALD_BLOCKS]: "Emerald Blocks",
} as const;

// Shop item validation schemas
export const addShopItemSchema = z.object({
  shopId: z.string().cuid("Invalid shop ID"),
  itemId: z.string().min(1, "Item ID is required"),
  price: z.number().positive("Price must be positive"),
  amount: z
    .number()
    .int()
    .positive("Amount must be a positive integer")
    .default(1),
  currency: z
    .enum([CURRENCY_TYPES.EMERALDS, CURRENCY_TYPES.EMERALD_BLOCKS], {
      errorMap: () => ({
        message: "Currency must be emeralds or emerald blocks",
      }),
    })
    .default(CURRENCY_TYPES.EMERALDS),
});

export const updateShopItemSchema = z.object({
  shopItemId: z.string().cuid("Invalid shop item ID"),
  price: z.number().positive("Price must be positive").optional(),
  amount: z
    .number()
    .int()
    .positive("Amount must be a positive integer")
    .optional(),
  currency: z
    .enum([CURRENCY_TYPES.EMERALDS, CURRENCY_TYPES.EMERALD_BLOCKS])
    .optional(),
  isAvailable: z.boolean().optional(),
});

export const removeShopItemSchema = z.object({
  shopItemId: z.string().cuid("Invalid shop item ID"),
});

// Shop query schemas
export const getShopsSchema = z.object({
  userId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const getShopDetailsSchema = z.object({
  shopId: z.string().cuid("Invalid shop ID"),
  includeItems: z.boolean().default(true),
});

export const searchShopsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

// Type exports
export type CreateShopData = z.infer<typeof createShopSchema>;
export type UpdateShopData = z.infer<typeof updateShopSchema>;
export type DeleteShopData = z.infer<typeof deleteShopSchema>;
export type AddShopItemData = z.infer<typeof addShopItemSchema>;
export type UpdateShopItemData = z.infer<typeof updateShopItemSchema>;
export type RemoveShopItemData = z.infer<typeof removeShopItemSchema>;
export type GetShopsData = z.infer<typeof getShopsSchema>;
export type GetShopDetailsData = z.infer<typeof getShopDetailsSchema>;
export type SearchShopsData = z.infer<typeof searchShopsSchema>;
