import { Suspense } from "react";
import { notFound } from "next/navigation";
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
import { Skeleton } from "~/components/ui/skeleton";
import {
  ArrowLeft,
  Package,
  MessageCircle,
  Clock,
  CheckCircle,
  User,
  Coins,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { auth } from "~/server/auth";
import { getRequestDetails } from "~/server/actions/request-actions";
import { UserAvatar } from "~/components/ui/user-avatar";
import { ItemPreview } from "~/components/items/item-preview";
import { CURRENCY_TYPES, currencyDisplayNames } from "~/lib/validations/shop";
import type { RequestWithFullDetails } from "~/lib/types/request";

interface RequestDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function RequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>
      </div>

      <Suspense fallback={<RequestDetailsLoading />}>
        <RequestDetailsContent requestId={params.id} />
      </Suspense>
    </div>
  );
}

async function RequestDetailsContent({ requestId }: { requestId: string }) {
  const session = await auth();

  try {
    const result = await getRequestDetails({ requestId });

    if (!result.success) {
      if (result.error === "Request not found") {
        notFound();
      }
      throw new Error(result.error);
    }

    const { request } = result.data as { request: RequestWithFullDetails };
    const isOwner = session?.user?.id === request.requesterId;

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
            {!request.offers?.length ? (
              <div className="py-8 text-center">
                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <MessageCircle className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="mb-2 font-semibold">No offers yet</h3>
                <p className="text-muted-foreground text-sm">
                  {isOwner
                    ? "When players make offers, they'll appear here."
                    : "Be the first to make an offer on this request!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {request.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <UserAvatar
                        username={offer.offerer.mcUsername}
                        showUsername={true}
                        size="sm"
                      />
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            offer.status === "PENDING"
                              ? "secondary"
                              : offer.status === "ACCEPTED"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {offer.status}
                        </Badge>
                        <span className="text-muted-foreground text-sm">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {offer.offeredPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Offered Price:
                        </span>
                        {getCurrencyIcon(request.currency)}
                        <span className="font-bold text-green-600">
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
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-sm">{offer.message}</p>
                      </div>
                    )}

                    {isOwner && offer.status === "PENDING" && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="default">
                          Accept Offer
                        </Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading request details:", error);
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-lg font-semibold">Error Loading Request</h2>
        <p className="text-muted-foreground">
          There was an error loading this request. Please try again later.
        </p>
      </div>
    );
  }
}

function RequestDetailsLoading() {
  return (
    <div className="space-y-6">
      {/* Request Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Section Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
