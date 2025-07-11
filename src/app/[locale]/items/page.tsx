"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { searchItems } from "~/server/actions/item-actions";
import { getItemImageUrl } from "~/lib/utils/item-images";

interface MinecraftItem {
  id: string;
  nameEn: string;
  nameDe: string;
  filename: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<MinecraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "de">("en");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await searchItems({
        query: searchQuery,
        language,
        limit: 20,
      });

      if (result.success) {
        setItems(result.items);
      } else {
        console.error("Search failed:", result.error);
        setItems([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSearch();
    }
  };

  return (
    <PageWrapper>
      <h1 className="mb-8 text-3xl font-bold">Minecraft Items</h1>

      {/* Search Section */}
      <Card className="mb-6 p-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={() => void handleSearch()} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
            >
              English
            </Button>
            <Button
              variant={language === "de" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("de")}
            >
              Deutsch
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 p-4">
                <Image
                  src={getItemImageUrl(item.filename, "default")}
                  alt={language === "en" ? item.nameEn : item.nameDe}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/items/image-not-found-icon.png";
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">
                  {language === "en" ? item.nameEn : item.nameDe}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">{item.id}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isLoading && items.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No items found for &ldquo;{searchQuery}&rdquo;
          </p>
        </Card>
      )}

      {/* Instructions */}
      {!searchQuery && (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">How to use</h2>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>• Enter a search term to find Minecraft items</p>
            <p>
              • Search by item name or ID (e.g. &ldquo;diamond sword&rdquo; or
              &ldquo;minecraft:diamond_sword&rdquo;)
            </p>
            <p>• Switch between English and German names</p>
            <p>• Results will show up to 20 items</p>
          </div>
        </Card>
      )}
    </PageWrapper>
  );
}
