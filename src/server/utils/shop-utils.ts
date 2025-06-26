import { type Prisma } from "@prisma/client";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import type {
  ShopFilters,
  ShopSortOptions,
  ShopPermissions,
  ShopWithDetails,
  ShopItemWithItem,
} from "~/lib/types/shop";

/**
 * Check if the current user has permission to perform actions on a shop
 */
export async function validateShopOwnership(
  shopId: string,
  userId?: string,
): Promise<{ isOwner: boolean; shop?: ShopWithDetails }> {
  const targetUserId = userId ?? (await auth())?.user?.id;

  if (!targetUserId) {
    return { isOwner: false };
  }

  const shop = await db.shop.findFirst({
    where: { id: shopId, ownerId: targetUserId },
    include: {
      owner: { select: { mcUsername: true, id: true } },
      _count: { select: { shopItems: true } },
    },
  });

  return {
    isOwner: !!shop,
    shop: shop ?? undefined,
  };
}

/**
 * Get permissions for a user on a specific shop
 */
export async function getShopPermissions(
  shopId: string,
  userId?: string,
): Promise<ShopPermissions> {
  const { isOwner } = await validateShopOwnership(shopId, userId);

  return {
    canView: true, // Anyone can view shops
    canEdit: isOwner,
    canDelete: isOwner,
    canManageItems: isOwner,
  };
}

/**
 * Build where clause for shop queries with filters
 */
export function buildShopWhereClause(
  filters?: ShopFilters,
): Prisma.ShopWhereInput {
  const where: Prisma.ShopWhereInput = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.ownerId) {
    where.ownerId = filters.ownerId;
  }

  if (filters?.hasItems !== undefined) {
    if (filters.hasItems) {
      where.shopItems = {
        some: { isAvailable: true },
      };
    } else {
      where.shopItems = {
        none: {},
      };
    }
  }

  if (filters?.location) {
    const { x, y, z, radius = 100 } = filters.location;

    if (x !== undefined) {
      where.locationX = {
        gte: x - radius,
        lte: x + radius,
      };
    }

    if (y !== undefined) {
      where.locationY = {
        gte: y - radius,
        lte: y + radius,
      };
    }

    if (z !== undefined) {
      where.locationZ = {
        gte: z - radius,
        lte: z + radius,
      };
    }
  }

  return where;
}

/**
 * Build order by clause for shop queries
 */
export function buildShopOrderBy(
  sort?: ShopSortOptions,
): Prisma.ShopOrderByWithRelationInput[] {
  if (!sort) {
    return [{ isActive: "desc" }, { updatedAt: "desc" }];
  }

  const orderBy: Prisma.ShopOrderByWithRelationInput[] = [];

  switch (sort.field) {
    case "name":
      orderBy.push({ name: sort.direction });
      break;
    case "createdAt":
      orderBy.push({ createdAt: sort.direction });
      break;
    case "updatedAt":
      orderBy.push({ updatedAt: sort.direction });
      break;
    case "itemCount":
      orderBy.push({
        shopItems: {
          _count: sort.direction,
        },
      });
      break;
    default:
      orderBy.push({ updatedAt: sort.direction });
  }

  return orderBy;
}

/**
 * Validate that a Minecraft item exists
 */
export async function validateMinecraftItem(itemId: string): Promise<boolean> {
  const item = await db.minecraftItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  });

  return !!item;
}

/**
 * Check if an item is already in a shop
 */
export async function isItemInShop(
  shopId: string,
  itemId: string,
): Promise<boolean> {
  const existingShopItem = await db.shopItem.findFirst({
    where: {
      shopId,
      itemId,
    },
    select: { id: true },
  });

  return !!existingShopItem;
}

/**
 * Validate shop item ownership for operations
 */
export async function validateShopItemOwnership(
  shopItemId: string,
  userId?: string,
): Promise<{ isOwner: boolean; shopItem?: ShopItemWithItem }> {
  const targetUserId = userId ?? (await auth())?.user?.id;

  if (!targetUserId) {
    return { isOwner: false };
  }

  const shopItem = await db.shopItem.findFirst({
    where: {
      id: shopItemId,
      shop: { ownerId: targetUserId },
    },
    include: {
      item: true,
      shop: { select: { name: true, ownerId: true } },
    },
  });

  return {
    isOwner: !!shopItem,
    shopItem: shopItem ?? undefined,
  };
}

/**
 * Format location coordinates for display
 */
export function formatLocation(x?: number, y?: number, z?: number): string {
  if (x === undefined || y === undefined || z === undefined) {
    return "No location set";
  }
  return `${x}, ${y}, ${z}`;
}

/**
 * Calculate distance between two locations
 */
export function calculateDistance(
  pos1: { x?: number; y?: number; z?: number },
  pos2: { x?: number; y?: number; z?: number },
): number | null {
  if (
    pos1.x === undefined ||
    pos1.y === undefined ||
    pos1.z === undefined ||
    pos2.x === undefined ||
    pos2.y === undefined ||
    pos2.z === undefined
  ) {
    return null;
  }

  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Common error handler for shop operations
 */
export function handleShopError(
  error: unknown,
  operation: string,
): { success: false; error: string } {
  console.error(`${operation} error:`, error);

  if (error instanceof Error) {
    return { success: false, error: error.message };
  }

  return { success: false, error: `Failed to ${operation.toLowerCase()}` };
}
