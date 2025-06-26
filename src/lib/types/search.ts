import type { User, MinecraftItem } from "@prisma/client";
import type { ShopWithDetails, ShopItemWithItem } from "./shop";

// Search result types
export interface PlayerSearchResult {
  id: string;
  mcUsername: string;
  mcUUID: string | null; // UUID for avatar generation (null if not available)
  shopCount: number;
  hasActiveShops: boolean;
}

export interface ItemSearchResult extends MinecraftItem {
  shopCount: number; // Number of shops selling this item
  shops: ShopWithItemPrice[]; // Limited set of shops selling this item
}

export interface ShopWithItemPrice extends ShopWithDetails {
  shopItem: Pick<
    ShopItemWithItem,
    "price" | "amount" | "currency" | "isAvailable"
  >;
}

// Unified search result
export interface UnifiedSearchResult {
  players: PlayerSearchResult[];
  items: ItemSearchResult[];
  totalResults: number;
  searchType: "player" | "item" | "mixed";
}

// Search action result type
export type SearchActionResult<T = unknown> =
  | { success: false; error: string }
  | { success: true; data: T };

// Search filter and options
export interface SearchOptions {
  maxPlayersPerQuery?: number;
  maxItemsPerQuery?: number;
  maxShopsPerItem?: number;
  includeInactiveShops?: boolean;
}

// Search suggestions type
export interface SearchSuggestion {
  type: "player" | "item";
  text: string;
  subtitle?: string;
  data: PlayerSearchResult | ItemSearchResult;
}

export interface SearchCriteria {
  type: "player" | "item" | "general";
  value: string;
  originalQuery: string;
}

export interface SearchCallbacks {
  onPlayerSearch?: (criteria: SearchCriteria & { type: "player" }) => void;
  onItemSearch?: (criteria: SearchCriteria & { type: "item" }) => void;
  onGeneralSearch?: (criteria: SearchCriteria & { type: "general" }) => void;
}
