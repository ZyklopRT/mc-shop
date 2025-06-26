import { getShopsByPlayerName } from "~/server/actions/search-actions";
import { toast } from "~/lib/utils/toast";
import type { PlayerSearchResult, ItemSearchResult } from "~/lib/types/search";

interface NavigationHandlers {
  router: {
    push: (url: string) => void;
  };
  onClose: () => void;
  onClear: () => void;
}

export async function handlePlayerNavigation(
  player: PlayerSearchResult,
  handlers: NavigationHandlers,
) {
  try {
    const result = await getShopsByPlayerName(player.mcUsername);

    if (result.success && result.data.shops.length === 1) {
      const firstShop = result.data.shops[0] as { id: string } | undefined;
      if (firstShop) {
        handlers.router.push(`/shops/${firstShop.id}`);
      } else {
        handlers.router.push(`/shops/browse?player=${player.mcUsername}`);
      }
    } else {
      handlers.router.push(`/shops/browse?player=${player.mcUsername}`);
    }

    handlers.onClose();
    handlers.onClear();
  } catch (error) {
    console.error("Navigation error:", error);
    toast.error("Navigation Failed", "Could not navigate to player shops");
    handlers.router.push(`/shops/browse?player=${player.mcUsername}`);
  }
}

export function handleItemNavigation(
  item: ItemSearchResult,
  handlers: NavigationHandlers,
) {
  if (item.shopCount && item.shopCount > 0) {
    if (item.shopCount === 1 && item.shops && item.shops.length > 0) {
      const shop = item.shops[0];
      if (shop?.id) {
        handlers.router.push(`/shops/${shop.id}`);
      } else {
        handlers.router.push(
          `/shops/browse?search=${encodeURIComponent(item.id)}`,
        );
      }
    } else {
      handlers.router.push(
        `/shops/browse?search=${encodeURIComponent(item.id)}`,
      );
    }
    handlers.onClose();
    handlers.onClear();
  }
}

export function handleGeneralNavigation(
  query: string,
  handlers: NavigationHandlers,
) {
  handlers.router.push(
    `/shops/browse?search=${encodeURIComponent(query.trim())}`,
  );
  handlers.onClose();
  handlers.onClear();
}
