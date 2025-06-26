import { useState, useEffect, useRef } from "react";
import type {
  UnifiedSearchResult,
  PlayerSearchResult,
  ItemSearchResult,
} from "~/lib/types/search";

interface UseSearchKeyboardProps {
  isOpen: boolean;
  results: UnifiedSearchResult | null;
  query: string;
  onPlayerSelect: (player: PlayerSearchResult) => void;
  onItemSelect: (item: ItemSearchResult) => void;
  onGeneralSearch: (query: string) => void;
  onClose: () => void;
}

export function useSearchKeyboard({
  isOpen,
  results,
  query,
  onPlayerSelect,
  onItemSelect,
  onGeneralSearch,
  onClose,
}: UseSearchKeyboardProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalResults = results
    ? results.players.length + results.items.length
    : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results) {
      if (e.key === "Escape") {
        onClose();
        inputRef.current?.blur();
      }
      return;
    }

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
            onPlayerSelect(selected);
          } else if (selected) {
            onItemSelect(selected);
          }
        } else if (query.trim()) {
          onGeneralSearch(query.trim());
        }
        break;
      case "Escape":
        onClose();
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const resetSelection = () => {
    setSelectedIndex(-1);
  };

  const isItemSelected = (index: number, section: "player" | "item") => {
    if (section === "player") {
      return selectedIndex === index;
    } else {
      return selectedIndex === (results?.players.length ?? 0) + index;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  return {
    selectedIndex,
    inputRef,
    handleKeyDown,
    resetSelection,
    isItemSelected,
  };
}
