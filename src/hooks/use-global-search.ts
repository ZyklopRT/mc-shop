import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { unifiedSearch } from "~/server/actions/search-actions";
import { SEARCH_CONFIG } from "~/lib/constants/search-config";
import type {
  UnifiedSearchResult,
  SearchCriteria,
  SearchCallbacks,
} from "~/lib/types/search";
import type { SearchType } from "~/lib/constants/search-config";

interface UseGlobalSearchProps {
  searchType: SearchType;
}

export function useGlobalSearch({ searchType }: UseGlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);

  const [debouncedQuery] = useDebounce(query, SEARCH_CONFIG.DEBOUNCE_DELAY);

  useEffect(() => {
    const performSearch = async () => {
      if (
        !debouncedQuery.trim() ||
        debouncedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH
      ) {
        setResults(null);
        setIsLoading(false);
        setIsOpen(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsOpen(true);

        const result = await unifiedSearch({
          query: debouncedQuery.trim(),
          type: searchType,
          limit: SEARCH_CONFIG.MAX_RESULTS,
          language: "en",
        });

        if (result.success) {
          setResults(result.data);
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

  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setIsLoading(true);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    setResults(null);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const openDropdown = () => {
    if (query.trim() && query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setIsOpen(true);
    }
  };

  return {
    query,
    isOpen,
    isLoading,
    results,
    updateQuery,
    clearSearch,
    closeDropdown,
    openDropdown,
  };
}
