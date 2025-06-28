"use server";

import { db } from "~/server/db";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";
import type { RequestWithDetails } from "~/lib/types/request";

type HomepageActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Get latest shops for homepage display
 */
export async function getLatestShops(
  limit = 6,
): Promise<
  HomepageActionResult<(ShopWithDetails & { shopItems?: ShopItemWithItem[] })[]>
> {
  try {
    const shops = await db.shop.findMany({
      where: {
        isActive: true,
      },
      include: {
        owner: { select: { mcUsername: true, id: true } },
        _count: { select: { shopItems: true } },
        shopItems: {
          include: { item: true },
          where: { isAvailable: true },
          take: 3, // Show max 3 items per shop for preview
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { success: true, data: shops };
  } catch (error) {
    console.error("Get latest shops error:", error);
    return { success: false, error: "Failed to get latest shops" };
  }
}

/**
 * Get latest requests for homepage display
 */
export async function getLatestRequests(
  limit = 6,
): Promise<HomepageActionResult<RequestWithDetails[]>> {
  try {
    const requests = await db.request.findMany({
      where: {
        status: "OPEN", // Only show open requests on homepage
      },
      include: {
        requester: { select: { mcUsername: true, id: true } },
        item: true,
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Get latest requests error:", error);
    return { success: false, error: "Failed to get latest requests" };
  }
}

/**
 * Get homepage data (both shops and requests) in a single call
 */
export async function getHomepageData(params?: {
  shopsLimit?: number;
  requestsLimit?: number;
}): Promise<
  HomepageActionResult<{
    shops: (ShopWithDetails & { shopItems?: ShopItemWithItem[] })[];
    requests: RequestWithDetails[];
  }>
> {
  try {
    const { shopsLimit = 6, requestsLimit = 6 } = params ?? {};

    const [shopsResult, requestsResult] = await Promise.all([
      getLatestShops(shopsLimit),
      getLatestRequests(requestsLimit),
    ]);

    if (!shopsResult.success) {
      return { success: false, error: shopsResult.error };
    }

    if (!requestsResult.success) {
      return { success: false, error: requestsResult.error };
    }

    return {
      success: true,
      data: {
        shops: shopsResult.data,
        requests: requestsResult.data,
      },
    };
  } catch (error) {
    console.error("Get homepage data error:", error);
    return { success: false, error: "Failed to get homepage data" };
  }
}
