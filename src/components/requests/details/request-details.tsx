"use client";

import { useRequestData } from "~/lib/hooks/use-request-data";
import { RequestHeader } from "./request-header";
import { OfferForm, OfferList } from "../offers";
import { NegotiationInterface } from "../negotiation";
import { canMakeOffer } from "~/lib/utils/request-status";
import { Card, CardContent } from "~/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import type {
  RequestWithFullDetails,
  RequestOfferWithDetails,
} from "~/lib/types/request";
import type { RequestActions } from "~/lib/hooks/use-request-actions";
import { useTranslations } from "next-intl";

interface RequestDetailsProps {
  initialRequest: RequestWithFullDetails;
  currentUserId?: string;
  actions: RequestActions;
  className?: string;
}

export function RequestDetails({
  initialRequest,
  currentUserId,
  actions,
  className = "",
}: RequestDetailsProps) {
  const t = useTranslations("component.request-details");
  const { request, isLoading, error, refreshRequest } = useRequestData({
    requestId: initialRequest.id,
    autoLoad: false,
  });

  // Use initial request if we haven't loaded fresh data yet
  const currentRequest = request ?? initialRequest;

  // Transform offers to match expected type structure
  const transformOffers = (
    request: RequestWithFullDetails,
  ): RequestOfferWithDetails[] => {
    return request.offers.map((offer) => ({
      ...offer,
      request: {
        id: request.id,
        title: request.title,
        requesterId: request.requesterId,
        status: request.status,
      },
    }));
  };
  const isOwner = currentRequest.requesterId === currentUserId;
  const userCanMakeOffer = !isOwner && canMakeOffer(currentRequest.status);

  const handleOffersUpdated = () => {
    void refreshRequest();
  };

  const handleNegotiationUpdated = () => {
    void refreshRequest();
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="space-y-4 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-foreground text-lg font-semibold">
                {t("errorLoadingRequest")}
              </h3>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Request Header */}
      <RequestHeader request={currentRequest} isOwner={isOwner} />

      {/* Loading overlay */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">{t("refreshing")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Interface - Show when request is in negotiation or completed */}
      {currentRequest.negotiation &&
        ["IN_NEGOTIATION", "ACCEPTED", "COMPLETED"].includes(
          currentRequest.status,
        ) && (
          <NegotiationInterface
            negotiation={currentRequest.negotiation}
            currentUserId={currentUserId!}
            requestId={currentRequest.id}
            requestCurrency={currentRequest.currency}
            requestSuggestedPrice={currentRequest.suggestedPrice}
            acceptedOffer={currentRequest.offers.find(
              (offer) => offer.status === "ACCEPTED",
            )}
            requesterId={currentRequest.requesterId}
            requesterUsername={currentRequest.requester.mcUsername}
            actions={{
              sendNegotiationMessage: actions.sendNegotiationMessage,
              completeRequest: actions.completeRequest,
            }}
            onNegotiationUpdated={handleNegotiationUpdated}
          />
        )}

      {/* Offer Management Section - Only show for open requests */}
      {currentRequest.status === "OPEN" && (
        <div className="flex flex-col gap-4">
          {/* Make Offer Form */}
          {userCanMakeOffer && (
            <OfferForm
              requestId={currentRequest.id}
              currency={currentRequest.currency}
              suggestedPrice={currentRequest.suggestedPrice ?? undefined}
              createOfferAction={actions.createOffer}
              onOfferCreated={handleOffersUpdated}
            />
          )}

          {/* Offers List */}
          <div className={userCanMakeOffer ? "" : "lg:col-span-2"}>
            <OfferList
              requestId={currentRequest.id}
              isRequestOwner={isOwner}
              requestStatus={currentRequest.status}
              onOffersUpdated={handleOffersUpdated}
              getOffersAction={async (_data) => {
                // We already have offers from the request data
                return {
                  success: true as const,
                  data: { offers: transformOffers(currentRequest) },
                };
              }}
              updateOfferAction={actions.updateOffer}
            />
          </div>
        </div>
      )}

      {/* Read-only Offers List for non-open requests */}
      {currentRequest.status !== "OPEN" && currentRequest.offers.length > 0 && (
        <OfferList
          requestId={currentRequest.id}
          isRequestOwner={isOwner}
          requestStatus={currentRequest.status}
          onOffersUpdated={handleOffersUpdated}
          getOffersAction={async (_data) => {
            return {
              success: true as const,
              data: { offers: transformOffers(currentRequest) },
            };
          }}
          updateOfferAction={actions.updateOffer}
        />
      )}
    </div>
  );
}
