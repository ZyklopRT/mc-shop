import React from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  SEARCH_TYPE_CONFIG,
  type SearchType,
} from "~/lib/constants/search-config";

interface SearchTypeFilterProps {
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
}

export function SearchTypeFilter({
  searchType,
  onSearchTypeChange,
}: SearchTypeFilterProps) {
  const currentConfig = SEARCH_TYPE_CONFIG[searchType];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" type="button" className="shrink-0">
          <div className="flex items-center gap-1">
            <currentConfig.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{currentConfig.label}</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(SEARCH_TYPE_CONFIG).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onSearchTypeChange(key as SearchType)}
            className="flex items-center gap-2"
          >
            <config.icon className="h-3 w-3" />
            {config.label}
            {searchType === key && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
