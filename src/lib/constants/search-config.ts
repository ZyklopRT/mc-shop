import { Filter, User, Package } from "lucide-react";

export const SEARCH_TYPE_CONFIG = {
  auto: {
    label: "Auto",
    icon: Filter,
    placeholder: "Search players or items...",
  },
  player: {
    label: "Players",
    icon: User,
    placeholder: "Search for players...",
  },
  item: {
    label: "Items",
    icon: Package,
    placeholder: "Search for items...",
  },
} as const;

export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 3,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 10,
  MAX_DROPDOWN_HEIGHT: "max-h-96",
} as const;

export type SearchType = keyof typeof SEARCH_TYPE_CONFIG;
