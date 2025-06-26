"use server";

import { z } from "zod";
import { db } from "~/server/db";
import {
  unifiedSearchSchema,
  playerSearchSchema,
  itemSearchSchema,
  SEARCH_TYPES,
  type UnifiedSearchData,
  type PlayerSearchData,
  type ItemSearchData,
} from "~/lib/validations/search";
import type {
  SearchActionResult,
  UnifiedSearchResult,
  PlayerSearchResult,
  ItemSearchResult,
} from "~/lib/types/search";
import type { User, MinecraftItem, ShopItem, Shop } from "@prisma/client";
import type { ShopWithDetails } from "~/lib/types/shop";

/**
 * Search for players by Minecraft username
 */
export async function searchPlayers(
  data: PlayerSearchData,
): Promise<SearchActionResult<PlayerSearchResult[]>> {
  try {
    const { query, limit } = playerSearchSchema.parse(data);

    const players = await db.user.findMany({
      where: {
        mcUsername: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        mcUsername: true,
        mcUUID: true,
        _count: {
          select: {
            shops: {
              where: { isActive: true },
            },
          },
        },
        shops: {
          where: { isActive: true },
          select: { id: true },
          take: 1, // Just to check if user has any active shops
        },
      },
      orderBy: {
        mcUsername: "asc",
      },
      take: limit,
    });

    const results: PlayerSearchResult[] = (players as UserWithShopsCount[]).map(
      (player) => ({
        id: player.id,
        mcUsername: player.mcUsername,
        mcUUID: player.mcUUID,
        shopCount: player._count.shops,
        hasActiveShops: player.shops.length > 0,
      }),
    );

    return { success: true, data: results };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Player search error:", error);
    return { success: false, error: "Failed to search players" };
  }
}

/**
 * Search for items by name or ID and include shops that sell them
 */
export async function searchItems(
  data: ItemSearchData,
): Promise<SearchActionResult<ItemSearchResult[]>> {
  try {
    const { query, language, limit, includeShops } =
      itemSearchSchema.parse(data);

    // Search items by name or ID
    const nameField = language === "en" ? "nameEn" : "nameDe";

    const items = await db.minecraftItem.findMany({
      where: {
        OR: [
          { [nameField]: { contains: query, mode: "insensitive" } },
          { id: { contains: query, mode: "insensitive" } },
        ],
      },
      include: includeShops
        ? {
            _count: {
              select: {
                shopItems: {
                  where: {
                    isAvailable: true,
                    shop: { isActive: true },
                  },
                },
              },
            },
            shopItems: {
              where: {
                isAvailable: true,
                shop: { isActive: true },
              },
              include: {
                shop: {
                  include: {
                    owner: { select: { mcUsername: true, id: true } },
                    _count: { select: { shopItems: true } },
                  },
                },
              },
              orderBy: { price: "asc" }, // Show cheapest first
              take: 3, // Limit shops per item for performance
            },
          }
        : {
            _count: {
              select: {
                shopItems: {
                  where: {
                    isAvailable: true,
                    shop: { isActive: true },
                  },
                },
              },
            },
          },
      orderBy: [
        // Prioritize exact matches
        { [nameField]: "asc" },
        { id: "asc" },
      ],
      take: limit,
    });

    const results: ItemSearchResult[] = (
      items as MinecraftItemWithShopItems[]
    ).map((item) => ({
      ...item,
      shopCount: item._count.shopItems,
      shops: includeShops
        ? item.shopItems.map((shopItem) => ({
            ...shopItem.shop,
            shopItem: {
              price: shopItem.price,
              amount: shopItem.amount,
              currency: shopItem.currency,
              isAvailable: shopItem.isAvailable,
            },
          }))
        : [],
    }));

    // Sort results to prioritize items with shops first
    results.sort((a, b) => {
      // First, sort by shop availability (items with shops first)
      if (a.shopCount > 0 && b.shopCount === 0) return -1;
      if (a.shopCount === 0 && b.shopCount > 0) return 1;

      // Within each group, sort by shop count (descending)
      if (a.shopCount !== b.shopCount) return b.shopCount - a.shopCount;

      // Finally, sort alphabetically by name
      return a.nameEn.localeCompare(b.nameEn);
    });

    return { success: true, data: results };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Item search error:", error);
    return { success: false, error: "Failed to search items" };
  }
}

/**
 * Unified search that automatically detects search type and searches both players and items
 */
export async function unifiedSearch(
  data: UnifiedSearchData,
): Promise<SearchActionResult<UnifiedSearchResult>> {
  try {
    const { query, type, limit, language } = unifiedSearchSchema.parse(data);

    // Auto-detect search type if not specified
    let searchType = type;
    if (type === SEARCH_TYPES.AUTO) {
      // If query looks like a Minecraft item ID (contains underscores or colons), search items
      // If it looks like a username (alphanumeric, maybe with underscores), search both
      if (
        query.includes(":") ||
        (query.includes("_") && query.includes("__"))
      ) {
        searchType = SEARCH_TYPES.ITEM;
      } else if (/^[a-zA-Z0-9_]+$/.test(query)) {
        // Could be either, search both
        searchType = SEARCH_TYPES.AUTO;
      } else {
        // Default to item search for other cases
        searchType = SEARCH_TYPES.ITEM;
      }
    }

    const promises: [
      Promise<UserWithShopsCount[]>,
      Promise<MinecraftItemWithShopItems[]>,
    ] = [Promise.resolve([]), Promise.resolve([])];
    let searchPlayers = false;
    let searchItems = false;

    if (searchType === SEARCH_TYPES.AUTO) {
      searchPlayers = true;
      searchItems = true;
    } else if (searchType === SEARCH_TYPES.PLAYER) {
      searchPlayers = true;
    } else if (searchType === SEARCH_TYPES.ITEM) {
      searchItems = true;
    }

    // Execute searches in parallel
    if (searchPlayers) {
      promises[0] = db.user.findMany({
        where: {
          mcUsername: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          mcUsername: true,
          mcUUID: true,
          _count: {
            select: {
              shops: {
                where: { isActive: true },
              },
            },
          },
          shops: {
            where: { isActive: true },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { mcUsername: "asc" },
        take: Math.min(limit, 5), // Limit player results
      }) as Promise<UserWithShopsCount[]>;
    }

    if (searchItems) {
      const nameField = language === "en" ? "nameEn" : "nameDe";
      promises[1] = db.minecraftItem.findMany({
        where: {
          OR: [
            { [nameField]: { contains: query, mode: "insensitive" } },
            { id: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          _count: {
            select: {
              shopItems: {
                where: {
                  isAvailable: true,
                  shop: { isActive: true },
                },
              },
            },
          },
          shopItems: {
            where: {
              isAvailable: true,
              shop: { isActive: true },
            },
            include: {
              shop: {
                include: {
                  owner: { select: { mcUsername: true, id: true } },
                  _count: { select: { shopItems: true } },
                },
              },
            },
            orderBy: { price: "asc" },
            take: 2, // Limit shops per item
          },
        },
        orderBy: [{ [nameField]: "asc" }, { id: "asc" }],
        take: Math.min(limit, 8), // Limit item results
      }) as Promise<MinecraftItemWithShopItems[]>;
    }

    const [playersData, itemsData] = await Promise.all(promises);

    // Format results
    const players: PlayerSearchResult[] = playersData.map((player) => ({
      id: player.id,
      mcUsername: player.mcUsername,
      mcUUID: player.mcUUID,
      shopCount: player._count.shops,
      hasActiveShops: player.shops.length > 0,
    }));

    const items: ItemSearchResult[] = itemsData.map((item) => ({
      ...item,
      shopCount: item._count.shopItems,
      shops:
        item.shopItems?.map((shopItem) => ({
          ...shopItem.shop,
          shopItem: {
            price: shopItem.price,
            amount: shopItem.amount,
            currency: shopItem.currency,
            isAvailable: shopItem.isAvailable,
          },
        })) || [],
    }));

    // Sort items to prioritize those with shops first
    items.sort((a, b) => {
      // First, sort by shop availability (items with shops first)
      if (a.shopCount > 0 && b.shopCount === 0) return -1;
      if (a.shopCount === 0 && b.shopCount > 0) return 1;

      // Within each group, sort by shop count (descending)
      if (a.shopCount !== b.shopCount) return b.shopCount - a.shopCount;

      // Finally, sort alphabetically by name
      return a.nameEn.localeCompare(b.nameEn);
    });

    // Determine final search type based on results
    let finalSearchType: "player" | "item" | "mixed" = "mixed";
    if (players.length > 0 && items.length === 0) {
      finalSearchType = "player";
    } else if (players.length === 0 && items.length > 0) {
      finalSearchType = "item";
    }

    const result: UnifiedSearchResult = {
      players,
      items,
      totalResults: players.length + items.length,
      searchType: finalSearchType,
    };

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Unified search error:", error);
    return { success: false, error: "Search failed" };
  }
}

/**
 * Get shops by player username (for redirecting from player search)
 */
// Database query result interfaces
interface UserWithShopsCount
  extends Pick<User, "id" | "mcUsername" | "mcUUID"> {
  _count: {
    shops: number;
  };
  shops: Pick<Shop, "id">[];
}

interface MinecraftItemWithShopItems extends MinecraftItem {
  _count: {
    shopItems: number;
  };
  shopItems: (ShopItem & {
    shop: Shop & {
      owner: Pick<User, "mcUsername" | "id">;
      _count: { shopItems: number };
    };
  })[];
}

export async function getShopsByPlayerName(
  mcUsername: string,
): Promise<SearchActionResult<{ playerId: string; shops: ShopWithDetails[] }>> {
  try {
    const user = await db.user.findUnique({
      where: { mcUsername },
      select: {
        id: true,
        shops: {
          where: { isActive: true },
          include: {
            owner: { select: { mcUsername: true, id: true } },
            _count: { select: { shopItems: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 1, // Get the most recent shop for redirect
        },
      },
    });

    if (!user) {
      return { success: false, error: "Player not found" };
    }

    return {
      success: true,
      data: {
        playerId: user.id,
        shops: user.shops,
      },
    };
  } catch (error) {
    console.error("Get shops by player error:", error);
    return { success: false, error: "Failed to get player shops" };
  }
}
