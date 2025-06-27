"use client";

import { useState } from "react";
import { toast } from "sonner";
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
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  HandHeart,
  Flag,
  DollarSign,
  XCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "~/components/ui/user-avatar";
import { ItemPreview } from "~/components/items/item-preview";
import { CURRENCY_TYPES, currencyDisplayNames } from "~/lib/validations/shop";
import { OfferForm } from "./offer-form";
import { OfferList } from "./offer-list";
import { NegotiationInterface } from "./negotiation-interface";
import type {
  RequestWithFullDetails,
  RequestOfferWithDetails,
} from "~/lib/types/request";

interface RequestDetailsProps {
  request: RequestWithFullDetails;
  isOwner: boolean;
  currentUserId?: string;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
  // Server action props
  createOfferAction?: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { offerId: string };
  }>;
  getOffersAction?: (data: { requestId: string }) => Promise<{
    success: boolean;
    error?: string;
    data?: { offers: RequestOfferWithDetails[] };
  }>;
  updateOfferAction?: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { offerId: string; status: string };
  }>;
  sendNegotiationMessageAction?: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { messageId: string };
  }>;
  onNegotiationUpdated?: () => void;
  completeRequestAction?: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { requestId: string };
  }>;
}

export function RequestDetails({
  request,
  isOwner,
  currentUserId,
  onDelete,
  isDeleting = false,
  createOfferAction,
  getOffersAction,
  updateOfferAction,
  sendNegotiationMessageAction,
  onNegotiationUpdated,
  completeRequestAction,
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

      {/* Negotiation Section - Show when request is in negotiation */}
      {request.status === "IN_NEGOTIATION" &&
        request.negotiation &&
        currentUserId &&
        sendNegotiationMessageAction && (
          <NegotiationInterface
            negotiation={{
              ...request.negotiation,
              request: {
                requester: request.requester,
                item: request.item,
                id: request.id,
                title: request.title,
                description: request.description,
                requestType: request.requestType,
                itemId: request.itemId,
                itemQuantity: request.itemQuantity,
                suggestedPrice: request.suggestedPrice,
                currency: request.currency,
                status: request.status,
                requesterId: request.requesterId,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                completedAt: request.completedAt,
              },
            }}
            currentUserId={currentUserId}
            sendMessageAction={sendNegotiationMessageAction}
            onNegotiationUpdated={onNegotiationUpdated}
          />
        )}

      {/* Accepted Request Section - Show when request is accepted */}
      {request.status === "ACCEPTED" &&
        request.negotiation &&
        currentUserId && (
          <AcceptedRequestDetails
            request={request}
            negotiation={request.negotiation}
            currentUserId={currentUserId}
            completeRequestAction={completeRequestAction}
            onCompleted={onNegotiationUpdated}
          />
        )}

      {/* Offers Section - Show when request is open or completed */}
      {(request.status === "OPEN" || request.status === "COMPLETED") &&
        getOffersAction &&
        updateOfferAction && (
          <OfferList
            requestId={request.id}
            currency={request.currency}
            isRequestOwner={isOwner}
            requestStatus={request.status}
            getOffersAction={getOffersAction}
            updateOfferAction={updateOfferAction}
          />
        )}

      {/* Make Offer Section - Only show for non-owners when request is open */}
      {!isOwner && request.status === "OPEN" && createOfferAction && (
        <OfferForm
          requestId={request.id}
          suggestedPrice={request.suggestedPrice ?? undefined}
          currency={request.currency}
          createOfferAction={createOfferAction}
        />
      )}
    </div>
  );
}

// Component for showing accepted request details with negotiation history and completion
interface AcceptedRequestDetailsProps {
  request: RequestWithFullDetails;
  negotiation: NonNullable<RequestWithFullDetails["negotiation"]>;
  currentUserId: string;
  completeRequestAction?: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { requestId: string };
  }>;
  onCompleted?: () => void;
}

function AcceptedRequestDetails({
  request,
  negotiation,
  currentUserId,
  completeRequestAction,
  onCompleted,
}: AcceptedRequestDetailsProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  // Find the accepted offerer from negotiation messages
  const acceptedOffererMessage = negotiation.messages.find(
    (msg) =>
      msg.messageType === "ACCEPT" && msg.sender.id !== request.requesterId,
  );
  const acceptedOfferer = acceptedOffererMessage?.sender;

  // Find the final agreed price from the last counter-offer or accept message with price
  const finalPriceMessage = [...negotiation.messages]
    .reverse()
    .find(
      (msg) =>
        msg.priceOffer &&
        (msg.messageType === "COUNTER_OFFER" || msg.messageType === "ACCEPT"),
    );

  const finalPrice = finalPriceMessage?.priceOffer ?? request.suggestedPrice;

  const isRequester = currentUserId === request.requesterId;
  const isAcceptedOfferer = currentUserId === acceptedOfferer?.id;

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case CURRENCY_TYPES.EMERALD_BLOCKS:
        return <div className="h-4 w-4 rounded bg-green-600" />;
      case CURRENCY_TYPES.EMERALDS:
      default:
        return <Coins className="h-4 w-4 text-green-500" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "OFFER":
      case "COUNTER_OFFER":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "ACCEPT":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECT":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Send className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleComplete = async () => {
    if (!completeRequestAction) return;

    setIsCompleting(true);
    try {
      const formData = new FormData();
      formData.append("requestId", request.id);
      formData.append("negotiationId", negotiation.id);

      const result = await completeRequestAction(formData);

      if (result.success) {
        toast.success("Request marked as completed!");
        onCompleted?.();
      } else {
        toast.error(result.error ?? "Failed to complete request");
      }
    } catch {
      toast.error("An error occurred while completing the request");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Accepted Agreement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Agreement Reached
          </CardTitle>
          <CardDescription>
            The negotiation has been completed and both parties have agreed to
            the terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Final Terms */}
          <div className="rounded-lg border bg-green-50 p-4">
            <h3 className="mb-3 font-semibold text-green-800">
              Final Agreement
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-green-600">Agreed Price</div>
                <div className="flex items-center gap-2">
                  {getCurrencyIcon(request.currency)}
                  <span className="text-2xl font-bold text-green-700">
                    {finalPrice?.toFixed(2) ?? "0.00"}
                  </span>
                  <span className="text-green-600">
                    {currencyDisplayNames[
                      request.currency as keyof typeof currencyDisplayNames
                    ] ?? request.currency}
                  </span>
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm text-green-600">Accepted By</div>
                <UserAvatar
                  username={acceptedOfferer?.mcUsername ?? "Unknown"}
                  showUsername={true}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Participants */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground mb-2 text-sm">
                Requester
              </div>
              <UserAvatar
                username={request.requester.mcUsername}
                showUsername={true}
                size="md"
              />
            </div>
            <div>
              <div className="text-muted-foreground mb-2 text-sm">Provider</div>
              <UserAvatar
                username={acceptedOfferer?.mcUsername ?? "Unknown"}
                showUsername={true}
                size="md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Negotiation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5" />
            Negotiation History
          </CardTitle>
          <CardDescription>
            Complete conversation history from the negotiation process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-4 overflow-y-auto">
            {negotiation.messages.map((message) => {
              const isOwnMessage = message.sender.id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${
                      isOwnMessage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {getMessageTypeIcon(message.messageType)}
                      <span className="text-xs font-medium">
                        {message.messageType.replace("_", " ")}
                      </span>
                      {!isOwnMessage && (
                        <span className="text-xs opacity-75">
                          {message.sender.mcUsername}
                        </span>
                      )}
                    </div>

                    {message.priceOffer && (
                      <div className="mb-2 rounded bg-black/10 p-2">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {getCurrencyIcon(request.currency)}
                          <span>
                            {message.priceOffer}{" "}
                            {currencyDisplayNames[
                              request.currency as keyof typeof currencyDisplayNames
                            ] ?? request.currency}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-sm">{message.content}</p>

                    <div className="mt-1 text-xs opacity-75">
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completion Action - Only for the accepted offerer */}
      {isAcceptedOfferer && completeRequestAction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Complete Request
            </CardTitle>
            <CardDescription>
              Mark this request as completed once you have fulfilled your part
              of the agreement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isCompleting}>
                  <Flag className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark Request as Completed</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to mark this request as completed?
                    This indicates that you have fulfilled the agreement
                    (delivered the requested items/service) and the request is
                    now finished.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleComplete}>
                    {isCompleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Flag className="mr-2 h-4 w-4" />
                    )}
                    Mark Completed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Information for Requester */}
      {isRequester && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Waiting for Completion
            </CardTitle>
            <CardDescription>
              Your request has been accepted. The provider will mark it as
              completed once they fulfill the agreement.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
