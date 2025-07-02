"use client";

import { Button } from "~/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { RequestStatusBadge, RequestTypeBadge, CurrencyDisplay } from "../ui";
import { ItemPreview } from "~/components/items/item-preview";
import { UserAvatar } from "~/components/ui/user-avatar";
import { canEditRequest } from "~/lib/utils/request-status";
import type { RequestWithFullDetails } from "~/lib/types/request";

interface RequestHeaderProps {
  request: RequestWithFullDetails;
  isOwner: boolean;
  className?: string;
}

export function RequestHeader({
  request,
  isOwner,
  className = "",
}: RequestHeaderProps) {
  const canEdit = canEditRequest(request.status);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status and Type Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <RequestTypeBadge type={request.requestType} />
        <RequestStatusBadge status={request.status} />
      </div>

      {/* Request Title and Description */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h1 className="text-foreground text-3xl font-bold">
            {request.title}
          </h1>

          {/* Owner Actions */}
          {isOwner && canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/requests/${request.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <p className="text-foreground text-lg leading-relaxed">
          {request.description}
        </p>
      </div>

      {/* Request Author - Small and Compact */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Requested by</span>
        <UserAvatar
          username={request.requester.mcUsername}
          size="sm"
          showUsername
          className="text-foreground"
        />
      </div>

      {/* Main Request Details - Prominent Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Item Details (for item requests) */}
        {request.requestType === "ITEM" && request.item && (
          <div className="space-y-3">
            <h3 className="text-foreground text-lg font-semibold">
              Item Requested
            </h3>
            <ItemPreview
              item={request.item}
              imageSize="sm"
              amount={request.itemQuantity ?? 1}
              showRotatingImages={true}
            />
          </div>
        )}

        {/* Suggested Price */}
        {request.suggestedPrice !== null && (
          <div className="flex h-full flex-col space-y-3">
            <h3 className="text-foreground text-lg font-semibold">
              Suggested Price
            </h3>
            <div className="flex flex-1 flex-col justify-center rounded-lg border bg-green-50 p-4">
              <CurrencyDisplay
                amount={request.suggestedPrice}
                currency={request.currency}
                size="lg"
                className="font-bold text-green-700"
              />
              <div className="mt-1 text-sm text-green-600">
                Starting price for offers
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
