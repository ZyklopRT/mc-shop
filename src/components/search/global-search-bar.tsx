"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Search,
  Loader2,
  X,
  User,
  Package,
  Store,
  ArrowRight,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import {
  unifiedSearch,
  getShopsByPlayerName,
} from "~/server/actions/search-actions";
import { SEARCH_TYPES } from "~/lib/validations/search";
import { SearchItemResult } from "./search-item-result";
import { SearchPlayerResult } from "./search-player-result";
import type {
  UnifiedSearchResult,
  PlayerSearchResult,
  ItemSearchResult,
  SearchCriteria,
  SearchCallbacks,
} from "~/lib/types/search";
import { toast } from "~/lib/utils/toast";

type SearchMode = "dropdown" | "callback";

interface GlobalSearchBarProps {
  className?: string;
  mode?: SearchMode;
  placeholder?: string;
  searchCallbacks?: SearchCallbacks;
  onSearchExecuted?: () => void; // Called after search is executed in callback mode
}

export function GlobalSearchBar({
  className = "",
  mode = "dropdown",
  placeholder,
  searchCallbacks,
  onSearchExecuted,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"auto" | "player" | "item">(
    "auto",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchTypeLabels = {
    auto: "Auto",
    player: "Players",
    item: "Items",
  };

  const searchTypeIcons = {
    auto: Filter,
    player: User,
    item: Package,
  };

  const searchTypePlaceholders = {
    auto: placeholder ?? "Search players or items...",
    player: placeholder ?? "Search for players...",
    item: placeholder ?? "Search for items...",
  };

  // Debounce the search query (300ms delay, min 3 characters)
  const [debouncedQuery] = useDebounce(query, 300);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 3) {
        setResults(null);
        setIsLoading(false);
        setIsOpen(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsOpen(true); // Always show dropdown for both modes

        const result = await unifiedSearch({
          query: debouncedQuery.trim(),
          type: searchType,
          limit: 10,
          language: "en",
        });

        if (result.success) {
          setResults(result.data);

          // Remove automatic callback execution - let user choose from dropdown
        } else {
          console.error("Search error:", result.error);
          setResults(null);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    void performSearch();
  }, [debouncedQuery, searchType]);

  // Handle form submission (for callback mode)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "callback" && searchCallbacks && query.trim()) {
      const trimmedQuery = query.trim();

      // Determine search type and call appropriate callback
      if (searchType === "player" && searchCallbacks.onPlayerSearch) {
        searchCallbacks.onPlayerSearch({
          type: "player",
          value: trimmedQuery,
          originalQuery: trimmedQuery,
        });
      } else if (searchType === "item" && searchCallbacks.onItemSearch) {
        searchCallbacks.onItemSearch({
          type: "item",
          value: trimmedQuery,
          originalQuery: trimmedQuery,
        });
      } else if (searchCallbacks.onGeneralSearch) {
        searchCallbacks.onGeneralSearch({
          type: "general",
          value: trimmedQuery,
          originalQuery: trimmedQuery,
        });
      }

      onSearchExecuted?.();
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    // Show loading state immediately for responsive feedback
    if (value.length >= 3) {
      setIsLoading(true);
    }
  };

  // Handle player click
  const handlePlayerClick = async (player: {
    mcUsername: string;
    id: string;
  }) => {
    try {
      setIsLoading(true);

      if (mode === "callback" && searchCallbacks?.onPlayerSearch) {
        // In callback mode, use the callback instead of navigation
        searchCallbacks.onPlayerSearch({
          type: "player",
          value: player.mcUsername,
          originalQuery: query.trim(),
        });
        onSearchExecuted?.();
      } else {
        // Original dropdown mode behavior
        const result = await getShopsByPlayerName(player.mcUsername);

        if (result.success && result.data.shops.length === 1) {
          // Player has exactly 1 shop - navigate directly to it
          const firstShop = result.data.shops[0] as { id: string } | undefined;
          if (firstShop) {
            router.push(`/shops/${firstShop.id}`);
          } else {
            // Unable to get the shop details, fall back to browse with filter
            router.push(`/shops/browse?player=${player.mcUsername}`);
          }
        } else {
          // Player has 0 shops or multiple shops - navigate to browse page with player filter
          router.push(`/shops/browse?player=${player.mcUsername}`);
        }
      }

      setIsOpen(false);
      setQuery("");
    } catch (error) {
      console.error("Navigation error:", error);
      if (mode === "dropdown") {
        toast.error("Navigation Failed", "Could not navigate to player shops");
        // On error, fall back to browse page with player filter
        router.push(`/shops/browse?player=${player.mcUsername}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle item click
  const handleItemClick = (item: {
    id: string;
    shopCount?: number;
    shops?: { id: string }[];
  }) => {
    if (mode === "callback" && searchCallbacks?.onItemSearch) {
      // In callback mode, use the callback
      searchCallbacks.onItemSearch({
        type: "item",
        value: item.id,
        originalQuery: query.trim(),
      });
      onSearchExecuted?.();
      setIsOpen(false);
      setQuery("");
    } else {
      // Original dropdown mode behavior - smart navigation based on shop count
      if (item.shopCount && item.shopCount > 0) {
        if (item.shopCount === 1 && item.shops && item.shops.length > 0) {
          // Only 1 shop sells this item - navigate directly to that shop
          const shop = item.shops[0];
          if (shop?.id) {
            router.push(`/shops/${shop.id}`);
          } else {
            // Fallback to browse page with item filter if shop data is incomplete
            router.push(`/shops/browse?search=${encodeURIComponent(item.id)}`);
          }
        } else {
          // Multiple shops sell this item - navigate to browse page with item filter
          router.push(`/shops/browse?search=${encodeURIComponent(item.id)}`);
        }
        setIsOpen(false);
        setQuery("");
      }
      // If no shops, do nothing (item should be disabled)
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === "callback") {
      // In callback mode, only handle Enter for form submission
      if (e.key === "Enter") {
        handleFormSubmit(e);
      }
      return;
    }

    // Original dropdown mode keyboard navigation
    if (!isOpen || !results) return;

    const totalResults = results.players.length + results.items.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          const allResults: (PlayerSearchResult | ItemSearchResult)[] = [
            ...results.players,
            ...results.items,
          ];
          const selected = allResults[selectedIndex];

          if (selected && "mcUsername" in selected) {
            void handlePlayerClick(selected);
          } else if (selected) {
            handleItemClick(selected);
          }
        } else if (query.trim()) {
          // Navigate to browse with general search
          router.push(
            `/shops/browse?search=${encodeURIComponent(query.trim())}`,
          );
          setIsOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup handled by useDebounce
    };
  }, []);

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    setResults(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input with Filter */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={searchTypePlaceholders[searchType]}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && query.length >= 3 && setIsOpen(true)}
            className="pr-10 pl-10"
          />
          {query && (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {isLoading && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>

        {/* Search Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" type="button" className="shrink-0">
              <div className="flex items-center gap-1">
                {searchTypeIcons[searchType] &&
                  React.createElement(searchTypeIcons[searchType], {
                    className: "h-3 w-3",
                  })}
                <span className="hidden sm:inline">
                  {searchTypeLabels[searchType]}
                </span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(searchTypeLabels).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setSearchType(key as "auto" | "player" | "item")}
                className="flex items-center gap-2"
              >
                {searchTypeIcons[key as keyof typeof searchTypeIcons] &&
                  React.createElement(
                    searchTypeIcons[key as keyof typeof searchTypeIcons],
                    {
                      className: "h-3 w-3",
                    },
                  )}
                {label}
                {searchType === key && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Submit Button for Callback Mode */}
        {mode === "callback" && (
          <Button type="submit" disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        )}
      </form>

      {/* Search Results Dropdown - Show for both modes */}
      {isOpen && (
        <Card className="absolute top-full z-50 mt-1 w-full border shadow-lg">
          {isLoading && !results && (
            <CardContent className="p-4">
              <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            </CardContent>
          )}

          {results && (
            <div className="max-h-96 overflow-y-auto">
              {/* Players Section */}
              {results.players.length > 0 && (
                <div>
                  <CardHeader className="pt-3 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-blue-500" />
                      Players ({results.players.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0 pb-3">
                    {results.players.map((player, index) => (
                      <div
                        key={player.id}
                        className={`rounded ${
                          selectedIndex === index ? "bg-muted" : ""
                        }`}
                      >
                        <SearchPlayerResult
                          player={player}
                          onClick={() => void handlePlayerClick(player)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </div>
              )}

              {/* Separator with proper spacing */}
              {results.players.length > 0 && results.items.length > 0 && (
                <div className="px-4">
                  <Separator />
                </div>
              )}

              {/* Items Section */}
              {results.items.length > 0 && (
                <div>
                  <CardHeader className="pt-3 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4 text-green-500" />
                      Items ({results.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0 pb-3">
                    {results.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`rounded ${
                          selectedIndex === results.players.length + index
                            ? "bg-muted"
                            : ""
                        }`}
                      >
                        <SearchItemResult
                          item={item}
                          onClick={() => handleItemClick(item)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </div>
              )}

              {/* No Results */}
              {results.totalResults === 0 && (
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-center text-sm">
                    <Search className="mx-auto mb-2 h-8 w-8" />
                    No results found for &quot;{query}&quot;
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(
                            `/shops/browse?search=${encodeURIComponent(query)}`,
                          );
                          setIsOpen(false);
                          setQuery("");
                        }}
                      >
                        Browse all shops
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Search Tips */}
              {query.length >= 3 && results.totalResults > 0 && (
                <div className="bg-muted/30 border-t p-2">
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        router.push(
                          `/shops/browse?search=${encodeURIComponent(query)}`,
                        );
                        setIsOpen(false);
                        setQuery("");
                      }}
                    >
                      View all results
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
