"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
import { UserAvatar } from "~/components/ui/user-avatar";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { OfferStatusBadge, CurrencyDisplay } from "../ui";
import { formatDate, canUpdateOffer } from "~/lib/utils/request-status";
import type { RequestOfferWithDetails } from "~/lib/types/request";
import { useTranslations } from "next-intl";

interface OfferCardProps {
  offer: RequestOfferWithDetails;
  isRequestOwner: boolean;
  requestStatus: string;
  onOfferAction?: (
    offerId: string,
    action: "ACCEPTED" | "REJECTED" | "WITHDRAWN",
  ) => Promise<void>;
  className?: string;
}

export function OfferCard({
  offer,
  isRequestOwner,
  requestStatus,
  onOfferAction,
  className = "",
}: OfferCardProps) {
  const t = useTranslations("component.offer-card");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleOfferAction = async (
    action: "ACCEPTED" | "REJECTED" | "WITHDRAWN",
  ) => {
    if (!onOfferAction) return;

    setActionLoading(action);
    try {
      await onOfferAction(offer.id, action);
    } finally {
      setActionLoading(null);
    }
  };

  const canUpdate = canUpdateOffer(
    offer.status as "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN",
    requestStatus as
      | "OPEN"
      | "IN_NEGOTIATION"
      | "ACCEPTED"
      | "COMPLETED"
      | "CANCELLED",
  );
  const isCurrentUserOffer = !isRequestOwner; // Assume if not request owner, then it's their offer

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Offerer info */}
          <div className="flex items-center gap-3">
            <UserAvatar username={offer.offerer.mcUsername} size="md" />
            <div>
              <div className="text-foreground font-medium">
                {offer.offerer.mcUsername}
              </div>
              <div className="text-muted-foreground text-sm">
                {formatDate(offer.createdAt)}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <OfferStatusBadge status={offer.status} />
        </div>

        {/* Offer details */}
        <div className="mt-4 space-y-3">
          {/* Price */}
          {offer.offeredPrice !== null && (
            <div>
              <div className="text-muted-foreground text-sm">
                {t("offeredPrice")}
              </div>
              <CurrencyDisplay
                amount={offer.offeredPrice}
                currency={offer.currency}
                size="lg"
                className="text-foreground font-semibold"
              />
            </div>
          )}

          {/* Message */}
          {offer.message && (
            <div>
              <div className="text-muted-foreground text-sm">
                {t("message")}
              </div>
              <p className="bg-muted text-foreground rounded-lg p-3 text-sm">
                {offer.message}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {canUpdate && (
          <div className="mt-4 flex gap-2">
            {isRequestOwner && offer.status === "PENDING" && (
              <>
                {/* Accept offer */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      {actionLoading === "ACCEPTED" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {t("accept")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("acceptThisOffer")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("acceptOfferDescription", {
                          username: offer.offerer.mcUsername,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleOfferAction("ACCEPTED")}
                      >
                        {t("acceptOffer")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Reject offer */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      {actionLoading === "REJECTED" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      {t("reject")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("rejectThisOffer")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("rejectOfferDescription", {
                          username: offer.offerer.mcUsername,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleOfferAction("REJECTED")}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t("rejectOffer")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {/* Withdraw offer (for offer owner) */}
            {isCurrentUserOffer && offer.status === "PENDING" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading !== null}
                    className="w-full"
                  >
                    {actionLoading === "WITHDRAWN" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {t("withdraw")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("withdrawYourOffer")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("withdrawOfferDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleOfferAction("WITHDRAWN")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t("withdrawOffer")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
