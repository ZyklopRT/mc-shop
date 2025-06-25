"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import {
  addShopItemSchema,
  updateShopItemSchema,
  removeShopItemSchema,
  type AddShopItemData,
  type UpdateShopItemData,
  type RemoveShopItemData,
} from "~/lib/validations/shop";
import type {
  ShopActionResult,
  ShopItemWithItem,
  ShopItemResponse,
} from "~/lib/types/shop";
import {
  validateShopOwnership,
  validateShopItemOwnership,
  validateMinecraftItem,
  isItemInShop,
  handleShopError,
} from "~/server/utils/shop-utils";

/**
 * Add an item to a shop
 */
export async function addItemToShop(
  data: AddShopItemData,
): Promise<ShopActionResult<ShopItemWithItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = addShopItemSchema.parse(data);

    // Verify shop ownership
    const { isOwner } = await validateShopOwnership(
      validatedData.shopId,
      session.user.id,
    );

    if (!isOwner) {
      return { success: false, error: "Shop not found or access denied" };
    }

    // Verify item exists
    const itemExists = await validateMinecraftItem(validatedData.itemId);
    if (!itemExists) {
      return { success: false, error: "Item not found" };
    }

    // Check if item is already in shop
    const itemAlreadyInShop = await isItemInShop(
      validatedData.shopId,
      validatedData.itemId,
    );

    if (itemAlreadyInShop) {
      return { success: false, error: "Item already exists in this shop" };
    }

    const shopItem = await db.shopItem.create({
      data: validatedData,
      include: {
        item: true,
        shop: { select: { name: true } },
      },
    });

    return { success: true, data: shopItem };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Add item to shop");
  }
}

/**
 * Update a shop item (price, currency, availability)
 */
export async function updateShopItem(
  data: UpdateShopItemData,
): Promise<ShopActionResult<ShopItemWithItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { shopItemId, ...updateData } = updateShopItemSchema.parse(data);

    // Verify ownership through shop
    const { isOwner, shopItem: existingShopItem } =
      await validateShopItemOwnership(shopItemId, session.user.id);

    if (!isOwner || !existingShopItem) {
      return { success: false, error: "Shop item not found or access denied" };
    }

    const shopItem = await db.shopItem.update({
      where: { id: shopItemId },
      data: updateData,
      include: {
        item: true,
        shop: { select: { name: true } },
      },
    });

    return { success: true, data: shopItem };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Update shop item");
  }
}

/**
 * Remove an item from a shop
 */
export async function removeItemFromShop(
  data: RemoveShopItemData,
): Promise<ShopActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { shopItemId } = removeShopItemSchema.parse(data);

    // Verify ownership through shop
    const { isOwner } = await validateShopItemOwnership(
      shopItemId,
      session.user.id,
    );

    if (!isOwner) {
      return { success: false, error: "Shop item not found or access denied" };
    }

    await db.shopItem.delete({
      where: { id: shopItemId },
    });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    return handleShopError(error, "Remove item from shop");
  }
}

/**
 * Get all items in a shop
 */
export async function getShopItems(
  shopId: string,
  includeUnavailable = false,
): Promise<ShopActionResult<ShopItemWithItem[]>> {
  try {
    const where: { shopId: string; isAvailable?: boolean } = { shopId };

    if (!includeUnavailable) {
      where.isAvailable = true;
    }

    const shopItems = await db.shopItem.findMany({
      where,
      include: {
        item: true,
        shop: { select: { name: true } },
      },
      orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: shopItems };
  } catch (error) {
    return handleShopError(error, "Get shop items");
  }
}

/**
 * Bulk update shop item availability
 */
export async function bulkUpdateShopItems(
  shopId: string,
  itemIds: string[],
  updates: { isAvailable?: boolean; price?: number; currency?: string },
): Promise<ShopActionResult<number>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify shop ownership
    const { isOwner } = await validateShopOwnership(shopId, session.user.id);

    if (!isOwner) {
      return { success: false, error: "Shop not found or access denied" };
    }

    const result = await db.shopItem.updateMany({
      where: {
        shopId,
        id: { in: itemIds },
      },
      data: updates,
    });

    return { success: true, data: result.count };
  } catch (error) {
    return handleShopError(error, "Bulk update shop items");
  }
}

/**
 * Get shop item by ID (with ownership validation)
 */
export async function getShopItem(
  shopItemId: string,
): Promise<ShopActionResult<ShopItemWithItem>> {
  try {
    const shopItem = await db.shopItem.findUnique({
      where: { id: shopItemId },
      include: {
        item: true,
        shop: { select: { name: true, ownerId: true } },
      },
    });

    if (!shopItem) {
      return { success: false, error: "Shop item not found" };
    }

    return { success: true, data: shopItem };
  } catch (error) {
    return handleShopError(error, "Get shop item");
  }
}
