"use client";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { MapPin, Edit, ExternalLink } from "lucide-react";
import { StackedShopItems } from "./stacked-shop-items";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";

interface ShopCardProps {
  shop: ShopWithDetails & { shopItems?: ShopItemWithItem[] };
  currentUserId?: string;
  showEditButton?: boolean;
  className?: string;
}

export function ShopCard({
  shop,
  currentUserId,
  showEditButton = false,
  className,
}: ShopCardProps) {
  const isOwner = currentUserId === shop.owner.id;
  const canEdit = showEditButton && isOwner;

  return (
    <Card
      className={`group hover:shadow-primary/5 overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}
    >
      <div className="p-5">
        {/* Header with title and status */}
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {shop.name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Owner:{" "}
              <span className="font-medium text-gray-700">
                {shop.owner.mcUsername}
              </span>
            </p>
          </div>

          {/* Active Status Badge */}
          <Badge
            variant={shop.isActive ? "default" : "secondary"}
            className={`ml-3 ${
              shop.isActive
                ? "border-green-200 bg-green-100 text-green-800"
                : "border-gray-200 bg-gray-100 text-gray-600"
            }`}
          >
            {shop.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Description */}
        {shop.description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {shop.description}
          </p>
        )}

        {/* Shop Items Section - Grouped together */}
        {shop.shopItems && (
          <div className="mb-3 space-y-1.5">
            <div className="text-xs font-medium text-gray-500">
              {shop._count.shopItems} item
              {shop._count.shopItems === 1 ? "" : "s"} available
            </div>
            <StackedShopItems shopItems={shop.shopItems} />
          </div>
        )}

        {/* Location */}
        {shop.locationX !== null &&
          shop.locationY !== null &&
          shop.locationZ !== null && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="font-mono text-xs">
                {shop.locationX}, {shop.locationY}, {shop.locationZ}
              </span>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="group-hover:border-primary/20 flex-1"
          >
            <Link
              href={`/shops/${shop.id}`}
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              View Shop
            </Link>
          </Button>

          {canEdit && (
            <Button asChild size="sm" className="flex-1">
              <Link
                href={`/shops/${shop.id}/edit`}
                className="flex items-center justify-center gap-2"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
