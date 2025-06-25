"use client";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Package, Gem, Sword, Pickaxe, Axe } from "lucide-react";

interface StackedShopItemsPlaceholderProps {
  itemCount: number;
  className?: string;
}

export function StackedShopItemsPlaceholder({
  itemCount,
  className,
}: StackedShopItemsPlaceholderProps) {
  const placeholderIcons = [Package, Gem, Sword, Pickaxe, Axe];

  if (itemCount === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="relative flex items-center">
          <Avatar className="border-background h-10 w-10 border-2">
            <AvatarFallback className="bg-gray-100 text-gray-400">
              <Package className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">No items available</p>
        </div>
      </div>
    );
  }

  // Show up to 5 placeholder icons
  const displayCount = Math.min(5, itemCount);
  const iconsToShow = placeholderIcons.slice(0, displayCount);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Stacked Placeholder Icons */}
      <div className="relative flex items-center">
        {iconsToShow.map((IconComponent, index) => (
          <Avatar
            key={index}
            className={`border-background h-10 w-10 border-2 ${
              index > 0 ? "-ml-3" : ""
            } ${index === 0 ? "z-10" : `z-${10 - index}`} transition-transform hover:z-20 hover:scale-110`}
          >
            <AvatarFallback className="bg-gradient-to-br from-blue-50 to-purple-50 text-gray-600">
              <IconComponent className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        ))}

        {/* Show count if more than 5 items */}
        {itemCount > 5 && (
          <div className="ml-2">
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              +{itemCount - 5}
            </Badge>
          </div>
        )}
      </div>

      {/* Items Label */}
      <div className="max-w-[180px] text-center">
        <p className="text-xs leading-tight text-gray-600">
          <span className="font-medium">
            {itemCount} item{itemCount === 1 ? "" : "s"} available
          </span>
        </p>
      </div>
    </div>
  );
}
