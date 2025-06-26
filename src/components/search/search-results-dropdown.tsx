import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Search, Loader2, User, Package, ArrowRight } from "lucide-react";
import { SearchItemResult } from "./search-item-result";
import { SearchPlayerResult } from "./search-player-result";
import { SEARCH_CONFIG } from "~/lib/constants/search-config";
import type {
  UnifiedSearchResult,
  PlayerSearchResult,
  ItemSearchResult,
} from "~/lib/types/search";

interface SearchResultsDropdownProps {
  isLoading: boolean;
  results: UnifiedSearchResult | null;
  query: string;
  onPlayerClick: (player: PlayerSearchResult) => void;
  onItemClick: (item: ItemSearchResult) => void;
  onViewAllResults: () => void;
  isItemSelected: (index: number, section: "player" | "item") => boolean;
}

export function SearchResultsDropdown({
  isLoading,
  results,
  query,
  onPlayerClick,
  onItemClick,
  onViewAllResults,
  isItemSelected,
}: SearchResultsDropdownProps) {
  if (isLoading && !results) {
    return (
      <Card className="absolute top-full z-50 mt-1 w-full border shadow-lg">
        <CardContent className="p-4">
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <Card className="absolute top-full z-50 mt-1 w-full border shadow-lg">
      <div className={SEARCH_CONFIG.MAX_DROPDOWN_HEIGHT + " overflow-y-auto"}>
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
                  className={`rounded ${isItemSelected(index, "player") ? "bg-muted" : ""}`}
                >
                  <SearchPlayerResult
                    player={player}
                    onClick={() => onPlayerClick(player)}
                  />
                </div>
              ))}
            </CardContent>
          </div>
        )}

        {/* Separator */}
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
                  className={`rounded ${isItemSelected(index, "item") ? "bg-muted" : ""}`}
                >
                  <SearchItemResult
                    item={item}
                    onClick={() => onItemClick(item)}
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
                <Button variant="outline" size="sm" onClick={onViewAllResults}>
                  Browse all shops
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {/* View All Results Footer */}
        {query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH &&
          results.totalResults > 0 && (
            <div className="bg-muted/30 border-t p-2">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={onViewAllResults}
                >
                  View all results
                </Button>
              </div>
            </div>
          )}
      </div>
    </Card>
  );
}
