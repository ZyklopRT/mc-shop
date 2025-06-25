"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { searchShops, getShops } from "~/server/actions/shops";
import type { ShopWithDetails } from "~/lib/types/shop";
import Link from "next/link";
import { MapPin, Package, Search, Store } from "lucide-react";

export default function BrowseShopsPage() {
  const [shops, setShops] = useState<ShopWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadAllShops();
  }, []);

  const loadAllShops = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(false);

      // Get all active shops (without user filter)
      const result = await getShops({ isActive: true, limit: 50, offset: 0 });
      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load shops");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadAllShops();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      setHasSearched(true);

      const result = await searchShops({
        query: searchQuery.trim(),
        limit: 50,
        offset: 0,
      });

      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    loadAllShops();
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
          <form onSubmit={handleSearch} className="flex gap-2">
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
            <Card
              key={shop.id}
              className="overflow-hidden transition-shadow hover:shadow-lg"
            >
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold">{shop.name}</h3>
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${shop.isActive ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      <span className="text-sm text-gray-600">
                        {shop.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-gray-500">
                      Owner:{" "}
                      <span className="font-medium">
                        {shop.owner.mcUsername}
                      </span>
                    </p>
                  </div>
                </div>

                {shop.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {shop.description}
                  </p>
                )}

                <div className="mb-4 space-y-2">
                  {shop.locationX !== null &&
                    shop.locationY !== null &&
                    shop.locationZ !== null && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {shop.locationX}, {shop.locationY}, {shop.locationZ}
                        </span>
                      </div>
                    )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>{shop._count.shopItems} items available</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/shops/${shop.id}`}>View Shop</Link>
                  </Button>
                </div>
              </div>
            </Card>
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
