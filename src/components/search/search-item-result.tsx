"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Coins, Store, ChevronRight } from "lucide-react";
import { getItemImageUrl } from "~/lib/utils/item-images";
import { currencyDisplayNames, CURRENCY_TYPES } from "~/lib/validations/shop";
import type { ItemSearchResult } from "~/lib/types/search";

interface SearchItemResultProps {
  item: ItemSearchResult;
  onClick?: () => void;
}

export function SearchItemResult({ item, onClick }: SearchItemResultProps) {
  const [currentImagePack, setCurrentImagePack] = useState<"default" | "sphax">(
    "default",
  );

  const hasShops = item.shopCount > 0;
  const isDisabled = !hasShops;

  useEffect(() => {
    if (!hasShops) return; // Don't animate if disabled

    const interval = setInterval(() => {
      setCurrentImagePack((prev) => (prev === "default" ? "sphax" : "default"));
    }, 8000);

    return () => clearInterval(interval);
  }, [hasShops]);

  const getCurrencyIcon = (currencyType: string) => {
    switch (currencyType) {
      case CURRENCY_TYPES.EMERALD_BLOCKS:
        return <div className="h-3 w-3 rounded bg-green-600" />;
      case CURRENCY_TYPES.EMERALDS:
      default:
        return <Coins className="h-3 w-3 text-green-500" />;
    }
  };

  const formatPrice = (price: number, currency: string, amount: number) => {
    const displayCurrency =
      currencyDisplayNames[currency as keyof typeof currencyDisplayNames] ||
      currency;

    return amount > 1
      ? `${price.toFixed(2)} ${displayCurrency} for ${amount}`
      : `${price.toFixed(2)} ${displayCurrency}`;
  };

  return (
    <Card
      className={`transition-colors ${
        isDisabled
          ? "cursor-default opacity-60"
          : "hover:bg-muted/50 cursor-pointer"
      }`}
      onClick={isDisabled ? undefined : onClick}
    >
      <CardContent className="p-2">
        <div className="flex items-start gap-3">
          {/* Item Image */}
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image
              src={getItemImageUrl(item.filename, currentImagePack)}
              alt={item.nameEn}
              fill
              className="rounded object-contain transition-opacity duration-500"
              sizes="32px"
              onError={(e) => {
                if (currentImagePack === "sphax") {
                  setCurrentImagePack("default");
                } else {
                  // Fallback to a default placeholder icon
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "data:image/svg+xml;base64," +
                    btoa(
                      `
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  `.trim(),
                    );
                }
              }}
            />
          </div>

          {/* Item Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium">{item.nameEn}</h4>
                {item.nameDe !== item.nameEn && (
                  <p className="text-muted-foreground truncate text-xs">
                    {item.nameDe}
                  </p>
                )}
              </div>

              <div
                className={`flex items-center gap-2 text-xs ${
                  isDisabled ? "text-muted-foreground" : "text-muted-foreground"
                }`}
              >
                <Store className="h-3 w-3" />
                <span className={isDisabled ? "text-red-500" : ""}>
                  {item.shopCount}
                </span>
                {!isDisabled && <ChevronRight className="h-3 w-3" />}
              </div>
            </div>

            {/* Shop Prices or No Shops Message */}
            {item.shops.length > 0 ? (
              <div className="mt-1 space-y-1">
                {item.shops.slice(0, 2).map((shop, index) => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <Link
                      href={`/shops/${shop.id}`}
                      className="truncate text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {shop.owner.mcUsername}
                    </Link>
                    <div className="flex items-center gap-1 text-green-600">
                      {getCurrencyIcon(shop.shopItem.currency)}
                      <span className="font-medium">
                        {formatPrice(
                          shop.shopItem.price,
                          shop.shopItem.currency,
                          shop.shopItem.amount,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {item.shops.length > 2 && (
                  <div className="text-muted-foreground text-xs">
                    +{item.shops.length - 2} more shops
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-1">
                <Badge
                  variant="secondary"
                  className="text-muted-foreground text-xs"
                >
                  No shops available
                </Badge>
              </div>
            )}

            {/* Item ID Badge */}
            <div className="mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {item.id}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
