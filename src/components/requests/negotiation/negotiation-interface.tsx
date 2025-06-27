"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useRequestActions } from "~/lib/hooks/use-request-actions";
import { MessageList } from "./negotiation-message";
import { NegotiationForm } from "./negotiation-form";
import { NegotiationStatus } from "./negotiation-status";
import type { RequestActions } from "~/lib/hooks/use-request-actions";
import type {
  NegotiationMessage,
  RequestNegotiation,
  RequestOffer,
  User,
} from "@prisma/client";

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

interface NegotiationInterfaceProps {
  negotiation: SimpleNegotiation;
  currentUserId: string;
  requestId: string;
  requestCurrency: string;
  requestSuggestedPrice?: number | null;
  acceptedOffer?: SimpleOffer;
  requesterId: string; // The ID of the person who made the request
  requesterUsername: string; // The username of the person who made the request
  actions: Pick<RequestActions, "sendNegotiationMessage" | "completeRequest">;
  onNegotiationUpdated?: () => void;
  className?: string;
}

export function NegotiationInterface({
  negotiation,
  currentUserId,
  requestId,
  requestCurrency,
  requestSuggestedPrice,
  acceptedOffer,
  requesterId,
  requesterUsername,
  actions,
  onNegotiationUpdated,
  className = "",
}: NegotiationInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const requestActions = useRequestActions(
    {
      ...actions,
      // Provide dummy implementations for unused actions
      createOffer: async () => ({ success: false, error: "Not implemented" }),
      updateOffer: async () => ({ success: false, error: "Not implemented" }),
      deleteRequest: async () => ({ success: false, error: "Not implemented" }),
    },
    {
      requestId: requestId,
      onSuccess: (action) => {
        if (action === "sendMessage") {
          onNegotiationUpdated?.();
        }
      },
      onError: (action, error) => {
        console.error(`Action ${action} failed:`, error);
      },
    },
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [negotiation.messages]);

  // Calculate acceptance status for form state
  const getAcceptanceStatus = () => {
    const lastCounterOffer = [...negotiation.messages]
      .reverse()
      .find((msg) => msg.messageType === "COUNTER_OFFER");

    const relevantMessages = lastCounterOffer
      ? negotiation.messages.filter(
          (msg) =>
            msg.messageType === "ACCEPT" &&
            new Date(msg.createdAt) > new Date(lastCounterOffer.createdAt),
        )
      : negotiation.messages.filter((msg) => msg.messageType === "ACCEPT");

    return {
      currentUserAccepted: relevantMessages.some(
        (msg) => msg.sender.id === currentUserId,
      ),
    };
  };

  const { currentUserAccepted } = getAcceptanceStatus();

  // Also calculate if the other party has accepted
  const getOtherPartyAcceptanceStatus = (): boolean => {
    const lastCounterOffer = [...negotiation.messages]
      .reverse()
      .find((msg) => msg.messageType === "COUNTER_OFFER");

    const relevantMessages = lastCounterOffer
      ? negotiation.messages.filter(
          (msg) =>
            msg.messageType === "ACCEPT" &&
            new Date(msg.createdAt) > new Date(lastCounterOffer.createdAt),
        )
      : negotiation.messages.filter((msg) => msg.messageType === "ACCEPT");

    // Check if anyone OTHER than the current user has accepted
    return Boolean(
      relevantMessages.some((msg) => msg.sender.id !== currentUserId),
    );
  };

  const otherPartyAccepted = getOtherPartyAcceptanceStatus();
  const isNegotiationComplete =
    negotiation.status === "AGREED" || negotiation.status === "FAILED";

  // Get current offer details for counter-offer validation
  const getCurrentOfferForCounterOffer = () => {
    // Check for latest counter-offer
    const lastCounterOffer = [...negotiation.messages]
      .reverse()
      .find((msg) => msg.messageType === "COUNTER_OFFER");

    if (lastCounterOffer && lastCounterOffer.priceOffer !== null) {
      return {
        price: lastCounterOffer.priceOffer,
        currency: requestCurrency, // Use request currency as it's updated with counter-offers
      };
    }

    // Use accepted offer as baseline
    if (acceptedOffer) {
      return {
        price: acceptedOffer.offeredPrice,
        currency: acceptedOffer.currency,
      };
    }

    // Fallback to request suggested price
    return {
      price: requestSuggestedPrice,
      currency: requestCurrency,
    };
  };

  const currentOfferForValidation = getCurrentOfferForCounterOffer();

  const handleSendMessage = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await requestActions.sendNegotiationMessage(formData);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (negotiation.status !== "AGREED") {
      toast.error("Cannot complete request", {
        description: "Both parties must accept the terms first.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("requestId", requestId);
    formData.append("negotiationId", negotiation.id);

    await requestActions.completeRequest(formData);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Negotiation Status Overview */}
      <NegotiationStatus
        negotiation={negotiation}
        currentUserId={currentUserId}
        requestCurrency={requestCurrency}
        requestSuggestedPrice={requestSuggestedPrice}
        acceptedOffer={acceptedOffer}
        requesterId={requesterId}
        requesterUsername={requesterUsername}
      />

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Negotiation Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-h-96 space-y-4 overflow-y-auto">
            <MessageList
              messages={negotiation.messages}
              currentUserId={currentUserId}
              requestCurrency={requestCurrency}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Message Form */}
          <NegotiationForm
            negotiationId={negotiation.id}
            isNegotiationComplete={isNegotiationComplete}
            currentUserAccepted={currentUserAccepted}
            otherPartyAccepted={otherPartyAccepted}
            currentOfferPrice={currentOfferForValidation.price}
            currentOfferCurrency={currentOfferForValidation.currency}
            onSubmit={handleSendMessage}
          />
        </CardContent>
      </Card>

      {/* Complete Request Button - Only show when negotiation is agreed */}
      {negotiation.status === "AGREED" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="font-medium text-green-600">
                🎉 Negotiation Complete!
              </div>
              <p className="text-gray-600">
                Both parties have agreed to the terms. You can now mark this
                request as completed.
              </p>
              <Button
                onClick={handleCompleteRequest}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Complete Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
