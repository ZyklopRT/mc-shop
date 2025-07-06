"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "~/lib/i18n/routing";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Search, Loader2, X } from "lucide-react";
import { useGlobalSearch } from "~/hooks/use-global-search";
import { useSearchKeyboard } from "~/hooks/use-search-keyboard";
import { SearchTypeFilter } from "./search-type-filter";
import { SearchResultsDropdown } from "./search-results-dropdown";
import {
  handlePlayerNavigation,
  handleItemNavigation,
  handleGeneralNavigation,
} from "~/lib/utils/search-navigation";
import { SEARCH_TYPE_CONFIG } from "~/lib/constants/search-config";
import type {
  SearchCallbacks,
  SearchCriteria,
  PlayerSearchResult,
  ItemSearchResult,
} from "~/lib/types/search";
import type { SearchType } from "~/lib/constants/search-config";

type SearchMode = "dropdown" | "callback";

interface GlobalSearchBarProps {
  className?: string;
  mode?: SearchMode;
  placeholder?: string;
  searchCallbacks?: SearchCallbacks;
  onSearchExecuted?: () => void;
}

export function GlobalSearchBar({
  className = "",
  mode = "dropdown",
  placeholder,
  searchCallbacks,
  onSearchExecuted,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const [searchType, setSearchType] = useState<SearchType>("auto");
  const searchRef = React.useRef<HTMLDivElement>(null);

  const getSearchCallback = (type: SearchType) => {
    if (!searchCallbacks) return undefined;

    switch (type) {
      case "player":
        return searchCallbacks.onPlayerSearch;
      case "item":
        return searchCallbacks.onItemSearch;
      default:
        return searchCallbacks.onGeneralSearch;
    }
  };

  const {
    query,
    isOpen,
    isLoading,
    results,
    updateQuery,
    clearSearch,
    closeDropdown,
    openDropdown,
  } = useGlobalSearch({
    searchType,
  });

  const navigationHandlers = {
    router,
    onClose: closeDropdown,
    onClear: clearSearch,
  };

  const handlePlayerClick = (
    player: PlayerSearchResult | { mcUsername: string; id: string },
  ) => {
    if (mode === "callback" && searchCallbacks?.onPlayerSearch) {
      searchCallbacks.onPlayerSearch({
        type: "player",
        value: player.mcUsername,
        originalQuery: query.trim(),
      });
      onSearchExecuted?.();
      closeDropdown();
      clearSearch();
    } else {
      const playerResult: PlayerSearchResult = {
        id: player.id,
        mcUsername: player.mcUsername,
        mcUUID: "mcUUID" in player ? player.mcUUID : null,
        shopCount: "shopCount" in player ? player.shopCount : 0,
        hasActiveShops:
          "hasActiveShops" in player ? player.hasActiveShops : false,
      };
      void handlePlayerNavigation(playerResult, navigationHandlers);
    }
  };

  const handleItemClick = (
    item:
      | ItemSearchResult
      | { id: string; shopCount?: number; shops?: { id: string }[] },
  ) => {
    if (mode === "callback" && searchCallbacks?.onItemSearch) {
      searchCallbacks.onItemSearch({
        type: "item",
        value: item.id,
        originalQuery: query.trim(),
      });
      onSearchExecuted?.();
      closeDropdown();
      clearSearch();
    } else {
      const itemResult: ItemSearchResult = {
        id: item.id,
        nameEn: "nameEn" in item ? item.nameEn : item.id,
        nameDe: "nameDe" in item ? item.nameDe : item.id,
        filename: "filename" in item ? item.filename : "",
        shopCount: item.shopCount ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        shops: ("shops" in item ? item.shops : []) as any,
        createdAt: "createdAt" in item ? item.createdAt : new Date(),
        updatedAt: "updatedAt" in item ? item.updatedAt : new Date(),
      };
      handleItemNavigation(itemResult, navigationHandlers);
    }
  };

  const handleGeneralSearch = (searchQuery: string) => {
    if (mode === "callback" && searchCallbacks?.onGeneralSearch) {
      searchCallbacks.onGeneralSearch({
        type: "general",
        value: searchQuery,
        originalQuery: query.trim(),
      });
      onSearchExecuted?.();
    } else {
      handleGeneralNavigation(searchQuery, navigationHandlers);
    }
  };

  const { inputRef, handleKeyDown, isItemSelected } = useSearchKeyboard({
    isOpen: mode === "dropdown" ? isOpen : false,
    results,
    query,
    onPlayerSelect: (player) => {
      void handlePlayerClick(player);
    },
    onItemSelect: handleItemClick,
    onGeneralSearch: handleGeneralSearch,
    onClose: closeDropdown,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "callback" && query.trim()) {
      const callback = getSearchCallback(searchType);
      if (callback) {
        const criteria: SearchCriteria = {
          type: searchType === "auto" ? "general" : searchType,
          value: query.trim(),
          originalQuery: query.trim(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
        (callback as any)(criteria);
        onSearchExecuted?.();
      }
    }
  };

  const currentPlaceholder =
    placeholder ?? SEARCH_TYPE_CONFIG[searchType].placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdown]);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="dark:text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={currentPlaceholder}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={openDropdown}
            className="bg-input/30 dark:bg-card dark:text-card-foreground dark:placeholder:text-muted-foreground pr-10 pl-10 text-white placeholder:text-white/70"
          />
          {query && (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="dark:text-muted-foreground dark:hover:text-foreground absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0 text-white hover:text-white"
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {isLoading && (
            <Loader2 className="dark:text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-white" />
          )}
        </div>

        <SearchTypeFilter
          searchType={searchType}
          onSearchTypeChange={setSearchType}
        />

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

      {isOpen && (
        <SearchResultsDropdown
          isLoading={isLoading}
          results={results}
          query={query}
          onPlayerClick={handlePlayerClick}
          onItemClick={handleItemClick}
          onViewAllResults={() => handleGeneralSearch(query)}
          isItemSelected={isItemSelected}
        />
      )}
    </div>
  );
}
