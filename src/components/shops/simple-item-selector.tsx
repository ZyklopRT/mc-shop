"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Package, Search, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { searchItems } from "~/server/actions/item-actions";
import { getItemImageUrl } from "~/lib/utils/item-images";
import Image from "next/image";
import type { MinecraftItem } from "@prisma/client";

interface ItemSelectorProps {
  selectedItem: MinecraftItem | null;
  onItemSelect: (item: MinecraftItem | null) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleItemSelector({
  selectedItem,
  onItemSelect,
  placeholder = "Search for an item...",
  className,
}: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MinecraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch suggestions when search query changes
  useEffect(() => {
    const searchWithDelay = setTimeout(() => {
      void (async () => {
        if (searchQuery.length >= 2) {
          setIsLoading(true);
          try {
            const result = await searchItems({
              query: searchQuery,
              language: "en",
              limit: 20,
            });

            if (result.success) {
              setSuggestions(result.items);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
          } catch (error) {
            console.error("Failed to search items:", error);
            setSuggestions([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      })();
    }, 300);

    return () => clearTimeout(searchWithDelay);
  }, [searchQuery]);

  const handleSelect = (item: MinecraftItem) => {
    onItemSelect(item);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onItemSelect(null);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor="item-selector">Minecraft Item</Label>

      {selectedItem ? (
        <Card className="mt-2 p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={getItemImageUrl(selectedItem.filename, "default")}
                alt={selectedItem.nameEn}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold">
                {selectedItem.nameEn}
              </h3>
              <p className="text-muted-foreground truncate text-sm">
                {selectedItem.id}
              </p>
              <Badge variant="secondary" className="mt-1">
                {selectedItem.nameDe}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="relative mt-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="item-selector"
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {showSuggestions && (
            <div className="bg-background absolute top-full z-50 mt-1 w-full rounded-md border shadow-lg">
              <div className="max-h-60 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    <Package className="mx-auto mb-2 h-8 w-8" />
                    No items found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-1">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="hover:bg-muted flex w-full items-center gap-3 rounded-md p-2 text-left"
                      >
                        <div className="relative h-8 w-8 flex-shrink-0">
                          <Image
                            src={getItemImageUrl(item.filename, "default")}
                            alt={item.nameEn}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {item.nameEn}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {item.id}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
