"use client";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Link } from "~/lib/i18n/routing";
import { MapPin, Edit, ExternalLink } from "lucide-react";
import { StackedShopItems } from "./stacked-shop-items";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";
import { hasValidTeleportCoordinates } from "~/lib/utils/coordinates";
import { useSession } from "next-auth/react";
import { TeleportShopButton } from "./teleport-shop-button";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("component.shop-card");
  const isOwner = currentUserId === shop.owner.id;
  const canEdit = showEditButton && isOwner;
  const canTeleport = hasValidTeleportCoordinates(
    shop.locationX,
    shop.locationY,
    shop.locationZ,
  );
  const { data: session } = useSession();

  return (
    <Card
      className={`group hover:shadow-primary/5 overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}
    >
      <div className="p-5">
        {/* Header with title and status */}
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate text-lg font-semibold">
              {shop.name}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t("owner")}{" "}
              <span className="text-foreground font-medium">
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
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            {shop.isActive ? t("active") : t("inactive")}
          </Badge>
        </div>

        {/* Description */}
        {shop.description && (
          <p className="text-muted-foreground mb-3 line-clamp-2 text-sm leading-relaxed">
            {shop.description}
          </p>
        )}

        {/* Shop Items Section - Grouped together */}
        {shop.shopItems && (
          <div className="mb-3 space-y-1.5">
            <div className="text-muted-foreground text-xs font-medium">
              {shop._count.shopItems}{" "}
              {shop._count.shopItems === 1 ? t("item") : t("items")}{" "}
              {t("available")}
            </div>
            <StackedShopItems shopItems={shop.shopItems} />
          </div>
        )}

        {/* Location */}
        {canTeleport && (
          <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
            <MapPin className="text-muted-foreground h-4 w-4" />
            <span className="font-mono text-xs">
              {shop.locationX}, {shop.locationY}, {shop.locationZ}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            asChild
            variant="default"
            size="sm"
            className="group-hover:border-primary/20 w-full"
          >
            <Link
              href={`/shops/${shop.id}`}
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              {t("viewShop")}
            </Link>
          </Button>

          {canEdit && (
            <Button asChild size="sm" className="w-full" variant="outline">
              <Link
                href={`/shops/${shop.id}/edit`}
                className="flex items-center justify-center gap-2"
              >
                <Edit className="h-3 w-3" />
                {t("edit")}
              </Link>
            </Button>
          )}

          {canTeleport && (
            <TeleportShopButton
              shopName={shop.name}
              x={shop.locationX ?? 0}
              y={shop.locationY ?? 0}
              z={shop.locationZ ?? 0}
              mcUsername={session?.user?.mcUsername ?? ""}
              variant="outline"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
