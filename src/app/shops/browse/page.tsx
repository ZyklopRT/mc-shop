"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  searchShopsForBrowse,
  getShopsForBrowse,
} from "~/server/actions/shops";
import { getShopsByPlayerName } from "~/server/actions/search-actions";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";
import Link from "next/link";
import { Search, Store, User, X } from "lucide-react";
import { toast } from "~/lib/utils/toast";
import { ShopCard } from "~/components/shops/shop-card";

export default function BrowseShopsPage() {
  const searchParams = useSearchParams();
  const [shops, setShops] = useState<
    (ShopWithDetails & { shopItems: ShopItemWithItem[] })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [playerFilter, setPlayerFilter] = useState<string | null>(null);

  // Initialize from URL parameters
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    const initialPlayer = searchParams.get("player");

    if (initialSearch) {
      setSearchQuery(initialSearch);
      setHasSearched(true);
    }

    if (initialPlayer) {
      setPlayerFilter(initialPlayer);
      void loadPlayerShops(initialPlayer);
    } else if (initialSearch) {
      void performSearch(initialSearch);
    } else {
      void loadAllShops();
    }
  }, [searchParams]);

  const loadPlayerShops = async (playerName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      const result = await getShopsByPlayerName(playerName);
      if (result.success) {
        // Convert the shop data to match our expected format
        const shopsWithItems = result.data.shops.map((shop) => ({
          ...shop,
          shopItems: [] as ShopItemWithItem[], // We'll load items separately if needed
        }));
        setShops(shopsWithItems);
      } else {
        setError(result.error);
        toast.error("Loading Failed", result.error);
      }
    } catch {
      setError("Failed to load player shops");
      toast.error("Loading Failed", "Failed to load player shops");
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      setError(null);
      setHasSearched(true);

      const result = await searchShopsForBrowse({
        query: query.trim(),
        limit: 50,
        offset: 0,
      });

      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
        toast.error("Search Failed", result.error);
      }
    } catch {
      setError("Search failed");
      toast.error("Search Failed", "Failed to search shops");
    } finally {
      setIsSearching(false);
    }
  };

  const loadAllShops = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(false);

      // Get all active shops (without user filter)
      const result = await getShopsForBrowse({ limit: 50, offset: 0 });
      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
        toast.error("Loading Failed", result.error);
      }
    } catch {
      setError("Failed to load shops");
      toast.error("Loading Failed", "Failed to load shops");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      void loadAllShops();
      return;
    }

    setPlayerFilter(null); // Clear player filter when doing text search
    void performSearch(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    setPlayerFilter(null);
    void loadAllShops();
  };

  const clearPlayerFilter = () => {
    setPlayerFilter(null);
    if (searchQuery.trim()) {
      void performSearch(searchQuery.trim());
    } else {
      void loadAllShops();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p>Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Store className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Browse Shops</h1>
            <p className="text-gray-600">
              Discover shops from players around the server
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4">
          <form onSubmit={(e) => void handleSearch(e)} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search shops by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
            {hasSearched && (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </form>
        </Card>

        {/* Active Filters */}
        {(playerFilter || hasSearched) && (
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Active filters:
              </span>

              {playerFilter && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Player: {playerFilter}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={clearPlayerFilter}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {hasSearched && searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search: {searchQuery}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => {
                      setSearchQuery("");
                      setHasSearched(false);
                      if (playerFilter) {
                        void loadPlayerShops(playerFilter);
                      } else {
                        void loadAllShops();
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear all
              </Button>
            </div>
          </Card>
        )}
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {hasSearched && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {shops.length === 0
              ? `No shops found for "${searchQuery}"`
              : `Found ${shops.length} shop${shops.length === 1 ? "" : "s"} for "${searchQuery}"`}
          </p>
        </div>
      )}

      {shops.length === 0 && !hasSearched ? (
        <Card className="p-8 text-center">
          <Store className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">No Active Shops</h2>
          <p className="mb-4 text-gray-600">
            There are currently no active shops on the server.
          </p>
          <Button asChild>
            <Link href="/shops/new">Create the First Shop</Link>
          </Button>
        </Card>
      ) : shops.length === 0 && hasSearched ? (
        <Card className="p-8 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">No Results</h2>
          <p className="mb-4 text-gray-600">
            No shops match your search criteria. Try different keywords.
          </p>
          <Button onClick={clearSearch}>Browse All Shops</Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} showEditButton={false} />
          ))}
        </div>
      )}

      {!hasSearched && shops.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Showing {shops.length} active shop{shops.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
