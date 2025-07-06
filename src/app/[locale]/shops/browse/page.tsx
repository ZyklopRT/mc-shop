"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PageHeader } from "~/components/ui/page-header";
import { PageWrapper } from "~/components/ui/page-wrapper";
import {
  searchShopsForBrowse,
  getShopsForBrowse,
} from "~/server/actions/shops";
import { getShopsByPlayerName } from "~/server/actions/search-actions";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";
import type { SearchCriteria, SearchCallbacks } from "~/lib/types/search";
import Link from "next/link";
import { Store, User, X } from "lucide-react";
import { toast } from "~/lib/utils/toast";
import { ShopCard } from "~/components/shops/shop-card";
import { GlobalSearchBar } from "~/components/search/global-search-bar";
import { useTranslations } from "next-intl";

export default function BrowseShopsPage() {
  const searchParams = useSearchParams();
  const [shops, setShops] = useState<
    (ShopWithDetails & { shopItems: ShopItemWithItem[] })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<{
    searchQuery?: string;
    playerName?: string;
    itemName?: string;
  }>({});

  const t = useTranslations("page.shops-browse");

  // Initialize from URL parameters
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    const initialPlayer = searchParams.get("player");

    if (initialPlayer) {
      setActiveFilters({ playerName: initialPlayer });
      void loadPlayerShops(initialPlayer);
    } else if (initialSearch) {
      setActiveFilters({ searchQuery: initialSearch });
      void performTextSearch(initialSearch);
    } else {
      void loadAllShops();
    }
  }, [searchParams]);

  const loadPlayerShops = async (playerName: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getShopsByPlayerName(playerName);
      if (result.success) {
        // The shops from getShopsByPlayerName already include owner and _count
        // We just need to add empty shopItems array for consistency
        const shopsWithItems = result.data.shops.map((shop) => ({
          ...shop,
          shopItems: [] as ShopItemWithItem[], // We'll load items separately if needed
        }));
        setShops(shopsWithItems);
      } else {
        setError(result.error);
        toast.error(t("toast.loadingFailed"), result.error);
      }
    } catch {
      const errorMessage = t("toast.failedToLoadPlayerShops");
      setError(errorMessage);
      toast.error(t("toast.loadingFailed"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const performTextSearch = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await searchShopsForBrowse({
        query: query.trim(),
        limit: 50,
        offset: 0,
      });

      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
        toast.error(t("toast.searchFailed"), result.error);
      }
    } catch {
      const errorMessage = t("toast.failedToSearchShops");
      setError(errorMessage);
      toast.error(t("toast.searchFailed"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllShops = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getShopsForBrowse({ limit: 50, offset: 0 });
      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
        toast.error(t("toast.loadingFailed"), result.error);
      }
    } catch {
      const errorMessage = t("toast.failedToLoadShops");
      setError(errorMessage);
      toast.error(t("toast.loadingFailed"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Search callbacks for the GlobalSearchBar
  const searchCallbacks: SearchCallbacks = {
    onPlayerSearch: (criteria: SearchCriteria & { type: "player" }) => {
      setActiveFilters({ playerName: criteria.value });
      void loadPlayerShops(criteria.value);
    },
    onItemSearch: (criteria: SearchCriteria & { type: "item" }) => {
      setActiveFilters({
        itemName: criteria.value,
        searchQuery: criteria.originalQuery,
      });
      void performTextSearch(criteria.value);
    },
    onGeneralSearch: (criteria: SearchCriteria & { type: "general" }) => {
      setActiveFilters({ searchQuery: criteria.value });
      void performTextSearch(criteria.value);
    },
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    void loadAllShops();
  };

  const clearFilter = (
    filterType: "searchQuery" | "playerName" | "itemName",
  ) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterType];
    setActiveFilters(newFilters);

    // If no filters remain, load all shops
    if (Object.keys(newFilters).length === 0) {
      void loadAllShops();
    } else {
      // Apply remaining filters
      if (newFilters.playerName) {
        void loadPlayerShops(newFilters.playerName);
      } else if (newFilters.searchQuery) {
        void performTextSearch(newFilters.searchQuery);
      }
    }
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;
  const hasResults = shops.length > 0;

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <PageHeader
          icon={<Store className="h-8 w-8" />}
          title={t("title")}
          description={t("description")}
        />

        {/* Reusable Search Bar */}
        <GlobalSearchBar
          mode="callback"
          placeholder={t("searchPlaceholder")}
          searchCallbacks={searchCallbacks}
          onSearchExecuted={() => setIsLoading(true)}
          className="mb-4"
        />

        {/* Active Filters */}
        {hasActiveFilters && (
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {t("activeFilters")}
              </span>

              {activeFilters.playerName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t("player")}: {activeFilters.playerName}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => clearFilter("playerName")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {activeFilters.itemName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {t("item")}: {activeFilters.itemName}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => clearFilter("itemName")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {activeFilters.searchQuery && !activeFilters.itemName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {t("search")}: {activeFilters.searchQuery}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => clearFilter("searchQuery")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                {t("clearAll")}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 mb-6 p-4">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            {!hasResults
              ? t("noShopsFound")
              : t("foundShops", { count: shops.length })}
          </p>
        </div>
      )}

      {!hasResults && !hasActiveFilters ? (
        <Card className="p-8 text-center">
          <Store className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">
            {t("noActiveShopsTitle")}
          </h2>
          <p className="text-muted-foreground mb-4">{t("noActiveShops")}</p>
          <Button asChild>
            <Link href="/shops/new">{t("createFirstShop")}</Link>
          </Button>
        </Card>
      ) : !hasResults && hasActiveFilters ? (
        <Card className="p-8 text-center">
          <Store className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="text-foreground mb-2 text-xl font-semibold">
            {t("noResultsTitle")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t("noResultsDescription")}
          </p>
          <Button onClick={clearAllFilters}>{t("browseAllShops")}</Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} showEditButton={false} />
          ))}
        </div>
      )}

      {!hasActiveFilters && hasResults && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t("showingShops", { count: shops.length })}
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
