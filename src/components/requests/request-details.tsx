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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Package,
  MessageCircle,
  Coins,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "~/components/ui/user-avatar";
import { ItemPreview } from "~/components/items/item-preview";
import { CURRENCY_TYPES, currencyDisplayNames } from "~/lib/validations/shop";
import type { RequestWithFullDetails } from "~/lib/types/request";

interface RequestDetailsProps {
  request: RequestWithFullDetails;
  isOwner: boolean;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
}

export function RequestDetails({
  request,
  isOwner,
  onDelete,
  isDeleting = false,
}: RequestDetailsProps) {
  const statusConfig = {
    OPEN: {
      label: "Open",
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
    IN_NEGOTIATION: {
      label: "In Negotiation",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
    },
    ACCEPTED: {
      label: "Accepted",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
    },
    COMPLETED: {
      label: "Completed",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "bg-gray-500",
      textColor: "text-gray-700",
      bgColor: "bg-gray-50",
    },
  };

  const getCurrencyIcon = (currencyType: string) => {
    switch (currencyType) {
      case CURRENCY_TYPES.EMERALD_BLOCKS:
        return <div className="h-4 w-4 rounded bg-green-600" />;
      case CURRENCY_TYPES.EMERALDS:
      default:
        return <Coins className="h-4 w-4 text-green-500" />;
    }
  };

  const currentStatus = statusConfig[request.status];

  return (
    <div className="space-y-6">
      {/* Request Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    request.requestType === "ITEM" ? "default" : "secondary"
                  }
                >
                  {request.requestType === "ITEM" ? (
                    <>
                      <Package className="mr-1 h-3 w-3" />
                      Item Request
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-1 h-3 w-3" />
                      Service Request
                    </>
                  )}
                </Badge>
                <div
                  className={`rounded-full px-3 py-1 ${currentStatus.bgColor} border`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${currentStatus.color}`}
                    />
                    <span
                      className={`text-sm font-medium ${currentStatus.textColor}`}
                    >
                      {currentStatus.label}
                    </span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl">{request.title}</CardTitle>
              <CardDescription className="text-base">
                {request.description}
              </CardDescription>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/requests/${request.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>

                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this request? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete}>
                          Delete Request
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Item Details for Item Requests */}
            {request.requestType === "ITEM" && request.item && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Requested Item</h3>
                <ItemPreview
                  item={request.item}
                  amount={request.itemQuantity ?? 1}
                  imageSize="md"
                  showRotatingImages={false}
                  className="bg-background"
                />
              </div>
            )}

            {/* Price Information */}
            {request.suggestedPrice && (
              <div className="rounded-lg border bg-green-50 p-4">
                <h3 className="mb-3 font-semibold">Offered Reward</h3>
                <div className="flex items-center gap-3">
                  {getCurrencyIcon(request.currency)}
                  <span className="text-2xl font-bold text-green-600">
                    {request.suggestedPrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    {currencyDisplayNames[
                      request.currency as keyof typeof currencyDisplayNames
                    ] ?? request.currency}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            {/* Request Metadata */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm">
                  Requested by
                </div>
                <UserAvatar
                  username={request.requester.mcUsername}
                  showUsername={true}
                  size="md"
                />
              </div>
              <div className="space-y-2 text-right">
                <div className="text-muted-foreground text-sm">Created</div>
                <div className="font-medium">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Offers ({request.offers?.length ?? 0})</CardTitle>
              <CardDescription>
                {isOwner
                  ? "Manage offers from other players"
                  : "View existing offers and make your own"}
              </CardDescription>
            </div>
            {!isOwner && request.status === "OPEN" && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Make Offer
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {request.offers && request.offers.length > 0 ? (
            <div className="space-y-4">
              {request.offers.map((offer) => (
                <div key={offer.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <UserAvatar
                      username={offer.offerer.mcUsername}
                      showUsername={true}
                      size="sm"
                    />
                    <Badge
                      variant={
                        offer.status === "ACCEPTED" ? "default" : "secondary"
                      }
                    >
                      {offer.status}
                    </Badge>
                  </div>
                  {offer.offeredPrice && (
                    <div className="mt-2 flex items-center gap-2">
                      {getCurrencyIcon(request.currency)}
                      <span className="font-semibold">
                        {offer.offeredPrice.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {currencyDisplayNames[
                          request.currency as keyof typeof currencyDisplayNames
                        ] ?? request.currency}
                      </span>
                    </div>
                  )}
                  {offer.message && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      {offer.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              No offers yet. Be the first to make an offer!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
