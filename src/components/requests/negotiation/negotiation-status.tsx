"use client";

import { Badge } from "~/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { CurrencyDisplay } from "../ui/currency-display";
import type {
  NegotiationMessage,
  RequestNegotiation,
  RequestOffer,
  User,
} from "@prisma/client";
import { useTranslations } from "next-intl";

// Simplified types for the component props
type NegotiationMessageWithSender = NegotiationMessage & {
  sender: Pick<User, "id" | "mcUsername">;
};

type SimpleNegotiation = RequestNegotiation & {
  messages: NegotiationMessageWithSender[];
};

type SimpleOffer = RequestOffer & {
  offerer: Pick<User, "id" | "mcUsername">;
};

interface NegotiationStatusProps {
  negotiation: SimpleNegotiation;
  currentUserId: string;
  requestCurrency: string;
  requestSuggestedPrice?: number | null;
  acceptedOffer?: SimpleOffer;
  requesterId: string; // The ID of the person who made the request
  requesterUsername: string; // The username of the person who made the request
  className?: string;
}

export function NegotiationStatus({
  negotiation,
  currentUserId,
  requestCurrency,
  requestSuggestedPrice,
  acceptedOffer,
  requesterId,
  requesterUsername,
  className = "",
}: NegotiationStatusProps) {
  const t = useTranslations("component.negotiation-status");

  // Calculate acceptance status
  const getAcceptanceStatus = () => {
    // Find the latest counter-offer
    const lastCounterOffer = [...negotiation.messages]
      .reverse()
      .find((msg) => msg.messageType === "COUNTER_OFFER");

    // If there's a counter-offer, only consider acceptances after it
    const relevantMessages = lastCounterOffer
      ? negotiation.messages.filter(
          (msg) =>
            msg.messageType === "ACCEPT" &&
            new Date(msg.createdAt) > new Date(lastCounterOffer.createdAt),
        )
      : negotiation.messages.filter((msg) => msg.messageType === "ACCEPT");

    return {
      requesterAccepted: relevantMessages.some(
        (msg) => msg.sender.id === requesterId,
      ),
      offererAccepted: relevantMessages.some(
        (msg) => msg.sender.id !== requesterId,
      ),
      currentUserAccepted: relevantMessages.some(
        (msg) => msg.sender.id === currentUserId,
      ),
    };
  };

  const { requesterAccepted, offererAccepted } = getAcceptanceStatus();

  // Get current offer details
  const getCurrentOfferDetails = () => {
    // Check for latest counter-offer
    const lastCounterOffer = [...negotiation.messages]
      .reverse()
      .find((msg) => msg.messageType === "COUNTER_OFFER");

    if (lastCounterOffer && lastCounterOffer.priceOffer !== null) {
      return {
        price: lastCounterOffer.priceOffer,
        currency: requestCurrency,
        source: "counter-offer" as const,
      };
    }

    // Use accepted offer as baseline
    if (acceptedOffer) {
      return {
        price: acceptedOffer.offeredPrice,
        currency: acceptedOffer.currency,
        source: "accepted-offer" as const,
      };
    }

    // Fallback to request suggested price
    return {
      price: requestSuggestedPrice,
      currency: requestCurrency,
      source: "suggested" as const,
    };
  };

  const currentOffer = getCurrentOfferDetails();
  const isNegotiationComplete =
    negotiation.status === "AGREED" || negotiation.status === "FAILED";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current negotiation status */}
      <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            {t("negotiationStatus")}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            {negotiation.status === "IN_PROGRESS" && (
              <>
                <Clock className="h-4 w-4 text-yellow-500" />
                <Badge
                  variant="outline"
                  className="border-yellow-300 text-yellow-600"
                >
                  {t("inProgress")}
                </Badge>
              </>
            )}
            {negotiation.status === "AGREED" && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-600"
                >
                  {t("agreed")}
                </Badge>
              </>
            )}
            {negotiation.status === "FAILED" && (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <Badge
                  variant="outline"
                  className="border-red-300 text-red-600"
                >
                  {t("failed")}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Current offer price */}
        <div className="text-right">
          <div className="text-muted-foreground text-sm">
            {t("currentTerms")}
          </div>
          <CurrencyDisplay
            amount={currentOffer.price}
            currency={currentOffer.currency}
            size="lg"
            className="text-muted-foreground font-semibold"
          />
        </div>
      </div>

      {/* Acceptance status - only show during active negotiation */}
      {negotiation.status === "IN_PROGRESS" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Requester acceptance */}
          <div className="flex items-center gap-2 rounded-lg border p-3">
            {requesterAccepted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{requesterUsername}</div>
              <div className="text-xs text-gray-500">
                {requesterAccepted ? t("accepted") : t("pending")}
              </div>
            </div>
          </div>

          {/* Offerer acceptance */}
          <div className="flex items-center gap-2 rounded-lg border p-3">
            {offererAccepted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">
                {acceptedOffer?.offerer?.mcUsername ?? t("offerer")}
              </div>
              <div className="text-xs text-gray-500">
                {offererAccepted ? t("accepted") : t("pending")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {negotiation.status === "IN_PROGRESS" && (
        <div className="text-muted-foreground text-center text-sm">
          {requesterAccepted && offererAccepted ? (
            <div className="font-medium text-green-600">
              ✓ Both parties have accepted the current terms
            </div>
          ) : (
            <div>
              Waiting for{" "}
              {!requesterAccepted && !offererAccepted
                ? "both parties"
                : !requesterAccepted
                  ? requesterUsername
                  : (acceptedOffer?.offerer?.mcUsername ?? "offerer")}{" "}
              to accept
            </div>
          )}
        </div>
      )}

      {/* Completion message */}
      {isNegotiationComplete && (
        <div className="rounded-lg border p-4 text-center">
          {negotiation.status === "AGREED" ? (
            <div className="text-green-600">
              🎉 Negotiation successful! The request can now be completed.
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Negotiation ended without agreement. The request is back to
              open status.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
