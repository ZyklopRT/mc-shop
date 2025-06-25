"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Coins, Pencil } from "lucide-react";
import { getItemImageUrl } from "~/lib/utils/item-images";
import { currencyDisplayNames, CURRENCY_TYPES } from "~/lib/validations/shop";
import type { MinecraftItem } from "@prisma/client";

interface ItemPreviewProps {
  item: MinecraftItem;
  price?: number;
  amount?: number;
  currency?: string;
  showRotatingImages?: boolean;
  imageSize?: "sm" | "md" | "lg";
  className?: string;
  onEdit?: () => void;
}

export function ItemPreview({
  item,
  price,
  amount,
  currency,
  showRotatingImages = true,
  imageSize = "md",
  className,
  onEdit,
}: ItemPreviewProps) {
  const [currentImagePack, setCurrentImagePack] = useState<"default" | "sphax">(
    "default",
  );

  useEffect(() => {
    if (!showRotatingImages) return;

    const interval = setInterval(() => {
      setCurrentImagePack((prev) => (prev === "default" ? "sphax" : "default"));
    }, 10000);

    return () => clearInterval(interval);
  }, [showRotatingImages]);

  const getCurrencyIcon = (currencyType?: string) => {
    if (!currencyType) return null;

    switch (currencyType) {
      case CURRENCY_TYPES.EMERALD_BLOCKS:
        return <div className="h-4 w-4 rounded bg-green-600" />;
      case CURRENCY_TYPES.EMERALDS:
      default:
        return <Coins className="h-4 w-4 text-green-500" />;
    }
  };

  const getImageSize = () => {
    switch (imageSize) {
      case "sm":
        return "h-12 w-12";
      case "lg":
        return "h-20 w-20";
      case "md":
      default:
        return "h-16 w-16";
    }
  };

  const getImageSizes = () => {
    switch (imageSize) {
      case "sm":
        return "(max-width: 768px) 48px, 48px";
      case "lg":
        return "(max-width: 768px) 80px, 80px";
      case "md":
      default:
        return "(max-width: 768px) 64px, 64px";
    }
  };

  const getContentSpacing = () => {
    switch (imageSize) {
      case "sm":
        return "gap-3";
      case "lg":
        return "gap-6";
      case "md":
      default:
        return "gap-4";
    }
  };

  return (
    <Card className={`relative ${className}`}>
      {onEdit && (
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      <CardContent className="p-4">
        <div className={`flex items-center ${getContentSpacing()}`}>
          <div className={`relative ${getImageSize()} flex-shrink-0`}>
            <Image
              src={getItemImageUrl(item.filename, currentImagePack)}
              alt={item.nameEn}
              fill
              className="pixel-art rounded-lg object-contain transition-opacity duration-500"
              sizes={getImageSizes()}
              onError={() => {
                if (currentImagePack === "sphax") {
                  setCurrentImagePack("default");
                }
              }}
            />
            {amount && amount > 1 && (
              <div className="absolute -right-1 -bottom-1 z-10">
                <Badge
                  variant="secondary"
                  className="h-4 border-none bg-black/70 px-1 py-0 text-xs text-[10px] text-white"
                >
                  {amount}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="space-y-1">
              <h4 className="text-lg leading-tight font-semibold">
                {item.nameEn}
              </h4>
              {item.nameDe !== item.nameEn && (
                <p className="text-muted-foreground text-sm leading-tight">
                  {item.nameDe}
                </p>
              )}
            </div>

            <Badge variant="outline" className="font-mono text-xs">
              {item.id}
            </Badge>

            {price !== undefined && currency && (
              <div className="flex items-center gap-2 pt-1">
                {getCurrencyIcon(currency)}
                <span className="text-lg font-bold text-green-600">
                  {price.toFixed(2)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {currencyDisplayNames[
                    currency as keyof typeof currencyDisplayNames
                  ] || currency}
                </span>
                {amount && amount > 1 && (
                  <>
                    <span className="text-muted-foreground text-sm">
                      for {amount} items
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({(price / amount).toFixed(2)} per item)
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ItemPreviewCompact({
  item,
  price,
  amount,
  currency,
  className,
  onEdit,
}: Omit<ItemPreviewProps, "imageSize" | "showRotatingImages">) {
  return (
    <ItemPreview
      item={item}
      price={price}
      amount={amount}
      currency={currency}
      imageSize="sm"
      showRotatingImages={true}
      className={className}
      onEdit={onEdit}
    />
  );
}

export function ItemPreviewLarge({
  item,
  price,
  amount,
  currency,
  className,
}: ItemPreviewProps) {
  return (
    <ItemPreview
      item={item}
      price={price}
      amount={amount}
      currency={currency}
      imageSize="lg"
      showRotatingImages={true}
      className={className}
    />
  );
}
