"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HandHeart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OfferCard } from "./offer-card";
import type { RequestOfferWithDetails } from "~/lib/types/request";
import { useTranslations } from "next-intl";

interface OfferListProps {
  requestId: string;
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
  className?: string;
}

export function OfferList({
  requestId,
  isRequestOwner,
  requestStatus,
  onOffersUpdated,
  getOffersAction,
  updateOfferAction,
  className = "",
}: OfferListProps) {
  const t = useTranslations("component.offer-list");
  const [offers, setOffers] = useState<RequestOfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getOffersAction({ requestId });

      if (result.success) {
        setOffers(result.data?.offers ?? []);
      } else {
        const errorMessage = result.error ?? "Failed to load offers";
        setError(errorMessage);
        toast.error("Error loading offers", { description: errorMessage });
      }
    } catch {
      const errorMessage = "An unexpected error occurred while loading offers";
      setError(errorMessage);
      toast.error("Error loading offers", { description: errorMessage });
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
    try {
      const formData = new FormData();
      formData.append("offerId", offerId);
      formData.append("status", action);

      const result = await updateOfferAction(formData);

      if (result.success) {
        const actionText = action.toLowerCase();
        toast.success(`Offer has been ${actionText} successfully.`);

        // Reload offers and notify parent
        await loadOffers();
        onOffersUpdated?.();
      } else {
        const errorMessage = result.error ?? "Failed to update offer";
        toast.error("Error updating offer", { description: errorMessage });
      }
    } catch {
      const errorMessage =
        "An unexpected error occurred while updating the offer";
      toast.error("Error updating offer", { description: errorMessage });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5" />
            {t("offers")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">
              {t("loadingOffers")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5" />
            {t("offers")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-red-600">
            <p>
              {t("errorLoadingOffers")} {error}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="h-5 w-5" />
          {t("offers")} ({offers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <HandHeart className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p>{t("noOffersYet")}</p>
            {!isRequestOwner && (
              <p className="mt-2 text-sm">{t("beFirstToMakeOffer")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                isRequestOwner={isRequestOwner}
                requestStatus={requestStatus}
                onOfferAction={handleOfferAction}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
