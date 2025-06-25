import type { Shop, ShopItem, MinecraftItem, User } from "@prisma/client";

// Base result types
export type ShopActionResult<T = unknown> =
  | { success: false; error: string }
  | { success: true; data: T };

// Shop with related data types
export interface ShopWithDetails extends Shop {
  owner: Pick<User, "mcUsername">;
  _count: {
    shopItems: number;
  };
}

export interface ShopWithItems extends Shop {
  owner: Pick<User, "mcUsername">;
  shopItems: ShopItemWithItem[];
}

export interface ShopItemWithItem extends ShopItem {
  item: MinecraftItem;
  shop?: Pick<Shop, "name">;
}

export interface ShopItemWithShop extends ShopItem {
  shop: Pick<Shop, "name">;
  item?: MinecraftItem;
}

// Request/Response types
export interface CreateShopRequest {
  name: string;
  description?: string;
  locationX?: number;
  locationY?: number;
  locationZ?: number;
}

export interface UpdateShopRequest {
  shopId: string;
  name?: string;
  description?: string;
  locationX?: number;
  locationY?: number;
  locationZ?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ShopListResponse {
  shops: ShopWithDetails[];
  total: number;
  hasMore: boolean;
}

export interface ShopDetailsResponse {
  shop: ShopWithItems;
}

export interface ShopItemResponse {
  shopItem: ShopItemWithItem;
}

// Prisma include options for reusability
export const shopIncludeBasic = {
  owner: { select: { mcUsername: true } },
  _count: { select: { shopItems: true } },
} as const;

export const shopIncludeWithItems = {
  owner: { select: { mcUsername: true } },
  shopItems: {
    include: { item: true },
    where: { isAvailable: true },
    orderBy: { createdAt: "desc" },
  },
} as const;

export const shopItemInclude = {
  item: true,
  shop: { select: { name: true } },
} as const;

// Shop ownership and permission types
export interface ShopPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageItems: boolean;
}

// Shop statistics types
export interface ShopStats {
  totalShops: number;
  activeShops: number;
  totalItems: number;
  averageItemsPerShop: number;
}

// Shop filter and sort options
export interface ShopFilters {
  isActive?: boolean;
  ownerId?: string;
  hasItems?: boolean;
  location?: {
    x?: number;
    y?: number;
    z?: number;
    radius?: number;
  };
}

export interface ShopSortOptions {
  field: "name" | "createdAt" | "updatedAt" | "itemCount";
  direction: "asc" | "desc";
}

export interface ShopQuery {
  filters?: ShopFilters;
  sort?: ShopSortOptions;
  pagination?: {
    limit: number;
    offset: number;
  };
}
