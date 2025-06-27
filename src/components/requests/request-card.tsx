"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Coins, Pencil } from "lucide-react";
import { RequestStatusBadge, RequestTypeBadge } from "./ui";
import Link from "next/link";
import { UserAvatar } from "~/components/ui/user-avatar";
import { ItemPreview } from "~/components/items/item-preview";
import { CURRENCY_TYPES, currencyDisplayNames } from "~/lib/validations/shop";

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  type: "ITEM" | "GENERAL";
  status: "OPEN" | "IN_NEGOTIATION" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  price?: number;
  currency: "emeralds" | "emerald_blocks";
  requester: string;
  offerCount: number;
  createdAt: string;
  item?: {
    id: string;
    nameEn: string;
    nameDe: string;
    filename: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  itemQuantity?: number | null;
  isOwner: boolean;
}

export function RequestCard({
  id,
  title,
  description,
  type,
  status,
  price,
  currency,
  requester,
  offerCount,
  createdAt,
  item,
  itemQuantity,
  isOwner,
}: RequestCardProps) {
  const getCurrencyIcon = (currencyType: string) => {
    switch (currencyType) {
      case CURRENCY_TYPES.EMERALD_BLOCKS:
        return <div className="h-4 w-4 rounded bg-green-600" />;
      case CURRENCY_TYPES.EMERALDS:
      default:
        return <Coins className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <RequestTypeBadge type={type} />
          <div className="flex items-center gap-3">
            <RequestStatusBadge status={status} />
            {isOwner && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/requests/${id}/edit`}>
                  <Pencil className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Item Preview for Item Requests */}
          {type === "ITEM" && item && (
            <div className="bg-muted/50 rounded-lg border p-3">
              <div className="mb-2">
                <span className="text-sm font-medium">Requesting:</span>
              </div>
              <ItemPreview
                item={item}
                amount={itemQuantity ?? 1}
                imageSize="sm"
                showRotatingImages={false}
                className="bg-background"
              />
            </div>
          )}

          {/* Price Information */}
          {price && (
            <div className="rounded-lg border bg-green-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Offered Reward:</span>
                <div className="flex items-center gap-2">
                  {getCurrencyIcon(currency)}
                  <span className="text-lg font-bold text-green-600">
                    {price.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {currencyDisplayNames[currency] ?? currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* User and Metadata */}
          <div className="flex items-center justify-between">
            <UserAvatar username={requester} showUsername={true} size="sm" />
            <span className="text-muted-foreground text-sm">{createdAt}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {offerCount} {offerCount === 1 ? "offer" : "offers"}
              </span>
              {offerCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/requests/${id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
