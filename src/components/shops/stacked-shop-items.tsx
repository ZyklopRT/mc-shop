"use client";

import { useState, useEffect } from "react";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Package } from "lucide-react";
import { getItemImageUrl } from "~/lib/utils/item-images";
import type { MinecraftItem } from "@prisma/client";

interface ShopItem {
  id: string;
  item: MinecraftItem;
  price: number;
  amount: number;
  currency: string;
  isAvailable: boolean;
}

interface StackedShopItemsProps {
  shopItems: ShopItem[];
  className?: string;
}

export function StackedShopItems({
  shopItems,
  className,
}: StackedShopItemsProps) {
  const [currentImagePack, setCurrentImagePack] = useState<"default" | "sphax">(
    "default",
  );
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImagePack((prev) => (prev === "default" ? "sphax" : "default"));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Reset failed images when pack changes
  useEffect(() => {
    setFailedImages(new Set());
  }, [currentImagePack]);

  const handleImageError = (itemId: string) => {
    if (currentImagePack === "sphax" && !failedImages.has(itemId)) {
      // Try default pack first
      setCurrentImagePack("default");
    } else {
      // Mark this specific item as failed
      setFailedImages((prev) => new Set(prev).add(itemId));
    }
  };

  // Get first 5 available items
  const displayItems = shopItems.filter((item) => item.isAvailable).slice(0, 5);

  if (displayItems.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="relative flex items-center">
          <Avatar className="border-background h-10 w-10 border-2">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <Package className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-xs">No items available</p>
        </div>
      </div>
    );
  }

  // Generate unique item names for the label, limit to first 3-4 for readability
  const uniqueItemNames = Array.from(
    new Set(displayItems.map((item) => item.item.nameEn)),
  ).slice(0, 3);

  const remainingCount = Math.max(
    0,
    shopItems.filter((item) => item.isAvailable).length -
      uniqueItemNames.length,
  );

  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      {/* Item Icons Side by Side */}
      <div className="flex items-center">
        {displayItems.map((shopItem, _index) => (
          <Avatar
            key={shopItem.id}
            className="border-background h-8 w-8 border transition-transform hover:scale-110"
          >
            <AvatarImage
              src={
                failedImages.has(shopItem.item.id)
                  ? "/items/image-not-found-icon.png"
                  : getItemImageUrl(shopItem.item.filename, currentImagePack)
              }
              alt={shopItem.item.nameEn}
              className="object-contain p-1"
              onError={() => handleImageError(shopItem.item.id)}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {shopItem.item.nameEn.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}

        {/* Show count if more than 5 items */}
        {shopItems.filter((item) => item.isAvailable).length > 5 && (
          <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
            +{shopItems.filter((item) => item.isAvailable).length - 5}
          </Badge>
        )}
      </div>

      {/* Items Label */}
      <div className="max-w-[180px] text-left">
        <p className="text-muted-foreground text-xs leading-tight">
          Sells{" "}
          <span className="font-medium">
            {uniqueItemNames.join(", ")}
            {remainingCount > 0 && ` +${remainingCount} more`}
          </span>
        </p>
      </div>
    </div>
  );
}
