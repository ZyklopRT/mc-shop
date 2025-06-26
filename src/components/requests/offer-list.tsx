"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
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
  HandHeart,
  CheckCircle,
  XCircle,
  Clock,
  Coins,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { RequestOfferWithDetails } from "~/lib/types/request";

interface OfferListProps {
  requestId: string;
  currency: string;
  isRequestOwner: boolean;
  requestStatus: string;
  onOffersUpdated?: () => void;
  getOffersAction: (data: { requestId: string }) => Promise<{
    success: boolean;
    error?: string;
    data?: { offers: RequestOfferWithDetails[] };
  }>;
  updateOfferAction: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { offerId: string; status: string };
  }>;
}

export function OfferList({
  requestId,
  currency,
  isRequestOwner,
  requestStatus,
  onOffersUpdated,
  getOffersAction,
  updateOfferAction,
}: OfferListProps) {
  const [offers, setOffers] = useState<RequestOfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    try {
      const result = await getOffersAction({ requestId });
      if (result.success) {
        setOffers(result.data?.offers ?? []);
      } else {
        toast.error(result.error ?? "Failed to load offers");
      }
    } catch (error) {
      console.error("Failed to load offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, [requestId, getOffersAction]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const handleOfferAction = async (
    offerId: string,
    action: "ACCEPTED" | "REJECTED" | "WITHDRAWN",
  ) => {
    setActionLoading(offerId);

    try {
      const formData = new FormData();
      formData.append("offerId", offerId);
      formData.append("status", action);

      const result = await updateOfferAction(formData);

      if (result.success) {
        const actionText =
          action === "ACCEPTED"
            ? "accepted"
            : action === "REJECTED"
              ? "rejected"
              : "withdrawn";
        toast.success(`Offer has been ${actionText} successfully.`);
        await loadOffers();
        onOffersUpdated?.();
      } else {
        toast.error(result.error ?? "Failed to update offer");
      }
    } catch (error) {
      console.error("Error updating offer:", error);
      toast.error("Failed to update offer");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 text-yellow-600"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="border-red-300 text-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "WITHDRAWN":
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            <XCircle className="mr-1 h-3 w-3" />
            Withdrawn
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCurrencyDisplay = (currencyType: string) => {
    switch (currencyType) {
      case "emerald_blocks":
        return "Emerald Blocks";
      case "emeralds":
      default:
        return "Emeralds";
    }
  };

  const getCurrencyIcon = (currencyType: string) => {
    switch (currencyType) {
      case "emerald_blocks":
        return <div className="h-4 w-4 rounded bg-green-600" />;
      case "emeralds":
      default:
        return <Coins className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5" />
            Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="h-5 w-5" />
          Offers ({offers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No offers yet. Be the first to make an offer!
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {offer.offerer.mcUsername?.charAt(0)?.toUpperCase() ??
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {offer.offerer.mcUsername}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>

                {offer.offeredPrice && (
                  <div className="mt-3 flex items-center gap-2">
                    {getCurrencyIcon(offer.currency ?? currency)}
                    <span className="font-semibold">
                      {offer.offeredPrice}{" "}
                      {getCurrencyDisplay(offer.currency ?? currency)}
                    </span>
                  </div>
                )}

                {offer.message && (
                  <div className="mt-3">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </div>
                    <p className="bg-muted/50 rounded p-2 text-sm">
                      {offer.message}
                    </p>
                  </div>
                )}

                {/* Action buttons for request owner */}
                {isRequestOwner &&
                  offer.status === "PENDING" &&
                  requestStatus === "OPEN" && (
                    <div className="mt-4 flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={actionLoading === offer.id}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Accept
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Accept Offer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to accept this offer from{" "}
                              {offer.offerer.mcUsername}? This will move the
                              request to negotiation status and reject all other
                              pending offers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleOfferAction(offer.id, "ACCEPTED")
                              }
                            >
                              Accept Offer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOfferAction(offer.id, "REJECTED")}
                        disabled={actionLoading === offer.id}
                      >
                        {actionLoading === offer.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}

                {/* Withdraw button for offer owner */}
                {!isRequestOwner && offer.status === "PENDING" && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOfferAction(offer.id, "WITHDRAWN")}
                      disabled={actionLoading === offer.id}
                    >
                      {actionLoading === offer.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      Withdraw Offer
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
