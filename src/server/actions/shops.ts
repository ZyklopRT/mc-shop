"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import {
  createShopSchema,
  updateShopSchema,
  deleteShopSchema,
  getShopsSchema,
  getShopDetailsSchema,
  searchShopsSchema,
  type CreateShopData,
  type UpdateShopData,
} from "~/lib/validations/shop";
import type {
  ShopActionResult,
  ShopWithDetails,
  ShopWithItems,
  ShopListResponse,
  ShopDetailsResponse,
} from "~/lib/types/shop";
import {
  validateShopOwnership,
  buildShopWhereClause,
  buildShopOrderBy,
  handleShopError,
} from "~/server/utils/shop-utils";

/**
 * Create a new shop
 */
export async function createShop(
  data: CreateShopData,
): Promise<ShopActionResult<ShopWithDetails>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createShopSchema.parse(data);

    const shop = await db.shop.create({
      data: {
        ...validatedData,
        ownerId: session.user.id,
      },
      include: {
        owner: { select: { mcUsername: true, id: true } },
        _count: { select: { shopItems: true } },
      },
    });

    return { success: true, data: shop };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Create shop");
  }
}

/**
 * Update an existing shop
 */
export async function updateShop(
  data: UpdateShopData,
): Promise<ShopActionResult<ShopWithDetails>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { shopId, ...updateData } = updateShopSchema.parse(data);

    // Verify ownership
    const { isOwner, shop: existingShop } = await validateShopOwnership(
      shopId,
      session.user.id,
    );

    if (!isOwner || !existingShop) {
      return { success: false, error: "Shop not found or access denied" };
    }

    const shop = await db.shop.update({
      where: { id: shopId },
      data: updateData,
      include: {
        owner: { select: { mcUsername: true } },
        _count: { select: { shopItems: true } },
      },
    });

    return { success: true, data: shop };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Update shop");
  }
}

/**
 * Delete a shop
 */
export async function deleteShop(
  data: z.infer<typeof deleteShopSchema>,
): Promise<ShopActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { shopId } = deleteShopSchema.parse(data);

    // Verify ownership
    const { isOwner } = await validateShopOwnership(shopId, session.user.id);

    if (!isOwner) {
      return { success: false, error: "Shop not found or access denied" };
    }

    await db.shop.delete({
      where: { id: shopId },
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Delete shop");
  }
}

/**
 * Get shops with optional filtering, sorting, and pagination
 */
export async function getShops(
  params?: z.infer<typeof getShopsSchema>,
): Promise<ShopActionResult<ShopListResponse>> {
  try {
    const session = await auth();
    const { userId, isActive, limit, offset } = getShopsSchema.parse(
      params ?? {},
    );

    const targetUserId = userId ?? session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "User ID required" };
    }

    const where = buildShopWhereClause({
      ownerId: targetUserId,
      isActive,
    });

    const orderBy = buildShopOrderBy();

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        where,
        include: {
          owner: { select: { mcUsername: true } },
          _count: { select: { shopItems: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.shop.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        shops,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Get shops");
  }
}

/**
 * Get detailed shop information including items
 */
export async function getShopDetails(
  data: z.infer<typeof getShopDetailsSchema>,
): Promise<ShopActionResult<ShopDetailsResponse>> {
  try {
    const session = await auth();
    const { shopId, includeItems } = getShopDetailsSchema.parse(data);

    // First get the shop to check ownership
    const shopWithOwner = await db.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });

    if (!shopWithOwner) {
      return { success: false, error: "Shop not found" };
    }

    const isOwner = session?.user?.id === shopWithOwner.ownerId;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      include: includeItems
        ? {
            owner: { select: { mcUsername: true, id: true } },
            shopItems: {
              include: { item: true },
              // Show all items to shop owner, only available items to others
              where: isOwner ? {} : { isAvailable: true },
              orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }],
            },
          }
        : {
            owner: { select: { mcUsername: true, id: true } },
            _count: { select: { shopItems: true } },
          },
    });

    if (!shop) {
      return { success: false, error: "Shop not found" };
    }

    return {
      success: true,
      data: { shop: shop as ShopWithItems },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Get shop details");
  }
}

/**
 * Search shops by name or description
 */
export async function searchShops(
  data: z.infer<typeof searchShopsSchema>,
): Promise<ShopActionResult<ShopListResponse>> {
  try {
    const { query, limit, offset } = searchShopsSchema.parse(data);

    const where = {
      AND: [
        { isActive: true },
        {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ],
    };

    const orderBy = buildShopOrderBy({ field: "updatedAt", direction: "desc" });

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        where,
        include: {
          owner: { select: { mcUsername: true } },
          _count: { select: { shopItems: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.shop.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        shops,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Search shops");
  }
}

/**
 * Get user's own shops with first 5 items included
 */
export async function getMyShopsWithItems(params?: {
  limit?: number;
  offset?: number;
}): Promise<
  ShopActionResult<{
    shops: (ShopWithDetails & { shopItems: ShopItemWithItem[] })[];
    total: number;
    hasMore: boolean;
  }>
> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { limit = 20, offset = 0 } = params ?? {};

    const where = { ownerId: session.user.id };
    const orderBy = buildShopOrderBy({ field: "updatedAt", direction: "desc" });

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        where,
        include: {
          owner: { select: { mcUsername: true, id: true } },
          _count: { select: { shopItems: true } },
          shopItems: {
            include: { item: true },
            orderBy: { createdAt: "desc" },
            take: 5, // Only get first 5 items for display
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.shop.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        shops: shops as (ShopWithDetails & { shopItems: ShopItemWithItem[] })[],
        total,
        hasMore,
      },
    };
  } catch (error) {
    return handleShopError(error, "Get my shops with items");
  }
}

/**
 * Get shops for browsing with first 5 items included
 */
export async function getShopsForBrowse(params?: {
  limit?: number;
  offset?: number;
}): Promise<
  ShopActionResult<{
    shops: (ShopWithDetails & { shopItems: ShopItemWithItem[] })[];
    total: number;
    hasMore: boolean;
  }>
> {
  try {
    const { limit = 20, offset = 0 } = params ?? {};

    const where = { isActive: true };
    const orderBy = buildShopOrderBy({ field: "updatedAt", direction: "desc" });

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        where,
        include: {
          owner: { select: { mcUsername: true } },
          _count: { select: { shopItems: true } },
          shopItems: {
            include: { item: true },
            where: { isAvailable: true },
            orderBy: { createdAt: "desc" },
            take: 5, // Only get first 5 items for stacked display
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.shop.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        shops,
        total,
        hasMore,
      },
    };
  } catch (error) {
    return handleShopError(error, "Get shops for browse");
  }
}

/**
 * Search shops for browsing with first 5 items included
 */
export async function searchShopsForBrowse(
  data: z.infer<typeof searchShopsSchema>,
): Promise<
  ShopActionResult<{
    shops: (ShopWithDetails & { shopItems: ShopItemWithItem[] })[];
    total: number;
    hasMore: boolean;
  }>
> {
  try {
    const { query, limit, offset } = searchShopsSchema.parse(data);

    const where = {
      AND: [
        { isActive: true },
        {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ],
    };

    const orderBy = buildShopOrderBy({ field: "updatedAt", direction: "desc" });

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        where,
        include: {
          owner: { select: { mcUsername: true } },
          _count: { select: { shopItems: true } },
          shopItems: {
            include: { item: true },
            where: { isAvailable: true },
            orderBy: { createdAt: "desc" },
            take: 5, // Only get first 5 items for stacked display
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.shop.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        shops,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Search shops for browse");
  }
}

/**
 * Get shops by username (public endpoint)
 */
export async function getShopsByUser(
  mcUsername: string,
): Promise<ShopActionResult<ShopListResponse>> {
  try {
    const shops = await db.shop.findMany({
      where: {
        owner: { mcUsername },
        isActive: true,
      },
      include: {
        owner: { select: { mcUsername: true } },
        _count: { select: { shopItems: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      data: {
        shops,
        total: shops.length,
        hasMore: false,
      },
    };
  } catch (error) {
    return handleShopError(error, "Get shops by user");
  }
}
