"use server";

import { db } from "~/server/db";
import { z } from "zod";
import { auth } from "~/server/auth";

// Validation schemas
const createShopSchema = z.object({
  name: z
    .string()
    .min(1, "Shop name is required")
    .max(100, "Shop name too long"),
  description: z.string().max(500, "Description too long").optional(),
  locationX: z.number().int().optional(),
  locationY: z.number().int().optional(),
  locationZ: z.number().int().optional(),
});

const updateShopSchema = z.object({
  shopId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  locationX: z.number().int().optional(),
  locationY: z.number().int().optional(),
  locationZ: z.number().int().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const addShopItemSchema = z.object({
  shopId: z.string(),
  itemId: z.string(),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("coins"),
});

const updateShopItemSchema = z.object({
  shopItemId: z.string(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

// Shop CRUD operations
export async function createShop(data: z.infer<typeof createShopSchema>) {
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
        owner: { select: { mcUsername: true } },
        _count: { select: { shopItems: true } },
      },
    });

    return { success: true, shop };
  } catch (error) {
    console.error("Create shop error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return { success: false, error: "Failed to create shop" };
  }
}

export async function updateShop(data: z.infer<typeof updateShopSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { shopId, ...updateData } = updateShopSchema.parse(data);

    // Verify ownership
    const existingShop = await db.shop.findFirst({
      where: { id: shopId, ownerId: session.user.id },
    });

    if (!existingShop) {
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

    return { success: true, shop };
  } catch (error) {
    console.error("Update shop error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return { success: false, error: "Failed to update shop" };
  }
}

export async function deleteShop(shopId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify ownership
    const existingShop = await db.shop.findFirst({
      where: { id: shopId, ownerId: session.user.id },
    });

    if (!existingShop) {
      return { success: false, error: "Shop not found or access denied" };
    }

    await db.shop.delete({
      where: { id: shopId },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete shop error:", error);
    return { success: false, error: "Failed to delete shop" };
  }
}

// Shop item management
export async function addItemToShop(data: z.infer<typeof addShopItemSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = addShopItemSchema.parse(data);

    // Verify shop ownership
    const shop = await db.shop.findFirst({
      where: { id: validatedData.shopId, ownerId: session.user.id },
    });

    if (!shop) {
      return { success: false, error: "Shop not found or access denied" };
    }

    // Verify item exists
    const item = await db.minecraftItem.findUnique({
      where: { id: validatedData.itemId },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    const shopItem = await db.shopItem.create({
      data: validatedData,
      include: {
        item: true,
        shop: { select: { name: true } },
      },
    });

    return { success: true, shopItem };
  } catch (error: any) {
    console.error("Add shop item error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Item already exists in this shop" };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return { success: false, error: "Failed to add item to shop" };
  }
}

export async function updateShopItem(
  data: z.infer<typeof updateShopItemSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { shopItemId, ...updateData } = updateShopItemSchema.parse(data);

    // Verify ownership through shop
    const existingShopItem = await db.shopItem.findFirst({
      where: {
        id: shopItemId,
        shop: { ownerId: session.user.id },
      },
    });

    if (!existingShopItem) {
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

    return { success: true, shopItem };
  } catch (error) {
    console.error("Update shop item error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return { success: false, error: "Failed to update shop item" };
  }
}

export async function removeItemFromShop(shopItemId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify ownership through shop
    const existingShopItem = await db.shopItem.findFirst({
      where: {
        id: shopItemId,
        shop: { ownerId: session.user.id },
      },
    });

    if (!existingShopItem) {
      return { success: false, error: "Shop item not found or access denied" };
    }

    await db.shopItem.delete({
      where: { id: shopItemId },
    });

    return { success: true };
  } catch (error) {
    console.error("Remove shop item error:", error);
    return { success: false, error: "Failed to remove item from shop" };
  }
}

// Shop queries
export async function getUserShops(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "User ID required" };
    }

    const shops = await db.shop.findMany({
      where: { ownerId: targetUserId },
      include: {
        _count: { select: { shopItems: true } },
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });

    return { success: true, shops };
  } catch (error) {
    console.error("Get user shops error:", error);
    return { success: false, error: "Failed to fetch shops" };
  }
}

export async function getShopDetails(shopId: string) {
  try {
    const shop = await db.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: { select: { mcUsername: true } },
        shopItems: {
          include: { item: true },
          where: { isAvailable: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shop) {
      return { success: false, error: "Shop not found" };
    }

    return { success: true, shop };
  } catch (error) {
    console.error("Get shop details error:", error);
    return { success: false, error: "Failed to fetch shop details" };
  }
}

export async function getShopsByUser(mcUsername: string) {
  try {
    const shops = await db.shop.findMany({
      where: {
        owner: { mcUsername },
        isActive: true,
      },
      include: {
        _count: { select: { shopItems: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, shops };
  } catch (error) {
    console.error("Get shops by user error:", error);
    return { success: false, error: "Failed to fetch user shops" };
  }
}
