"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
  MessageSquare,
  Coins,
  DollarSign,
  CheckCircle,
  XCircle,
  Send,
  HandHeart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENCY_TYPES, currencyDisplayNames } from "~/lib/validations/shop";
import { CurrencySelector } from "~/components/shops/currency-selector";
import type {
  NegotiationWithDetails,
  NegotiationMessageWithSender,
} from "~/lib/types/request";
import { useRouter } from "next/navigation";

const messageFormSchema = z.object({
  messageType: z.enum(["MESSAGE", "COUNTER_OFFER", "ACCEPT", "REJECT"]),
  content: z.string().min(1, "Message content is required").max(500),
  priceOffer: z.coerce.number().min(0).max(999999).optional(),
  currency: z.enum(["emeralds", "emerald_blocks"]).optional(),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

interface NegotiationInterfaceProps {
  negotiation: NegotiationWithDetails;
  currentUserId: string;
  onNegotiationUpdated?: () => void;
  sendMessageAction: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { messageId: string };
  }>;
}

export function NegotiationInterface({
  negotiation,
  currentUserId,
  onNegotiationUpdated,
  sendMessageAction,
}: NegotiationInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      messageType: "MESSAGE",
      content: "",
      priceOffer: undefined,
      currency: negotiation.request.currency as "emeralds" | "emerald_blocks",
    },
  });

  const messageType = form.watch("messageType");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [negotiation.messages]);

  // Check if both parties have accepted
  const requesterAccepted = negotiation.messages.some(
    (msg) =>
      msg.messageType === "ACCEPT" &&
      msg.sender.id === negotiation.request.requester.id,
  );
  const offererAccepted = negotiation.messages.some(
    (msg) =>
      msg.messageType === "ACCEPT" &&
      msg.sender.id !== negotiation.request.requester.id,
  );

  const currentUserAccepted = negotiation.messages.some(
    (msg) => msg.messageType === "ACCEPT" && msg.sender.id === currentUserId,
  );

  const isNegotiationComplete =
    negotiation.status === "AGREED" || negotiation.status === "FAILED";

  const onSubmit = async (data: MessageFormData) => {
    if (isNegotiationComplete) {
      toast.error("This negotiation is no longer active");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("negotiationId", negotiation.id);
      formData.append("messageType", data.messageType);
      formData.append("content", data.content);

      if (
        data.priceOffer !== undefined &&
        data.messageType === "COUNTER_OFFER"
      ) {
        formData.append("priceOffer", data.priceOffer.toString());
      }

      if (data.currency && data.messageType === "COUNTER_OFFER") {
        formData.append("currency", data.currency);
      }

      const result = await sendMessageAction(formData);

      if (result.success) {
        toast.success("Message sent successfully");
        form.reset();
        onNegotiationUpdated?.();
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to send message");
      }
    } catch {
      toast.error("An error occurred while sending the message");
    } finally {
      setIsLoading(false);
    }
  };

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
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "OFFER":
        return "Offer";
      case "COUNTER_OFFER":
        return "Counter Offer";
      case "ACCEPT":
        return "Accepted";
      case "REJECT":
        return "Rejected";
      default:
        return "Message";
    }
  };

  const renderMessage = (message: NegotiationMessageWithSender) => {
    const isOwnMessage = message.sender.id === currentUserId;
    const isSpecialMessage = ["ACCEPT", "REJECT", "COUNTER_OFFER"].includes(
      message.messageType,
    );

    return (
      <div
        key={message.id}
        className={`group mb-3 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex max-w-[75%] flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
        >
          {/* Sender name for received messages */}
          {!isOwnMessage && (
            <div className="mb-1 ml-3 text-xs font-medium text-gray-600">
              {message.sender.mcUsername}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`relative rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
              isOwnMessage
                ? isSpecialMessage
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                : isSpecialMessage
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border border-gray-200 bg-white text-gray-900"
            } ${isOwnMessage ? "rounded-br-md" : "rounded-bl-md"}`}
          >
            {/* Message type indicator for special messages */}
            {isSpecialMessage && (
              <div
                className={`mb-2 flex items-center gap-1.5 ${
                  isOwnMessage ? "text-white/90" : "text-emerald-700"
                }`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  {getMessageTypeIcon(message.messageType)}
                </div>
                <span className="text-xs font-semibold tracking-wide uppercase">
                  {getMessageTypeLabel(message.messageType)}
                </span>
              </div>
            )}

            {/* Price offer section */}
            {message.priceOffer && (
              <div
                className={`mb-3 rounded-xl p-3 ${
                  isOwnMessage
                    ? "bg-black/10 backdrop-blur-sm"
                    : "border border-emerald-200 bg-emerald-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      isOwnMessage ? "bg-white/20" : "bg-emerald-500"
                    }`}
                  >
                    {getCurrencyIcon(negotiation.request.currency)}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-bold ${
                        isOwnMessage ? "text-white" : "text-emerald-900"
                      }`}
                    >
                      {message.priceOffer.toLocaleString()}{" "}
                      {
                        currencyDisplayNames[
                          negotiation.request
                            .currency as keyof typeof currencyDisplayNames
                        ]
                      }
                    </div>
                    <div
                      className={`text-xs ${
                        isOwnMessage ? "text-white/75" : "text-emerald-700"
                      }`}
                    >
                      Offered Price
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message content */}
            {message.content && (
              <div
                className={`leading-relaxed ${
                  isOwnMessage ? "text-white" : "text-gray-800"
                }`}
              >
                <p className="text-sm break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div
              className={`mt-1.5 flex items-center justify-end gap-1 text-xs ${
                isOwnMessage ? "text-white/70" : "text-gray-500"
              }`}
            >
              <span>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isOwnMessage && (
                <div className="ml-1 flex">
                  <CheckCircle className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="h-5 w-5" />
          Negotiation
        </CardTitle>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span>Status:</span>
            <Badge
              variant={
                negotiation.status === "IN_PROGRESS"
                  ? "default"
                  : negotiation.status === "AGREED"
                    ? "secondary"
                    : "destructive"
              }
            >
              {negotiation.status === "IN_PROGRESS"
                ? "Active"
                : negotiation.status === "AGREED"
                  ? "Agreed"
                  : "Failed"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Acceptance:</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">
                Requester: {requesterAccepted ? "✓" : "○"}
              </span>
              <span className="text-xs">
                Offerer: {offererAccepted ? "✓" : "○"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="relative max-h-96 min-h-[200px] overflow-y-auto rounded-xl border bg-gradient-to-b from-gray-50/50 to-white">
          {negotiation.messages.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900">
                  Start the conversation
                </h3>
                <p className="text-sm text-gray-500">
                  Send a message to begin the negotiation process.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {negotiation.messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Form */}
        {!isNegotiationComplete && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select message type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MESSAGE">Message</SelectItem>
                        <SelectItem value="COUNTER_OFFER">
                          Counter Offer
                        </SelectItem>
                        <SelectItem
                          value="ACCEPT"
                          disabled={currentUserAccepted}
                        >
                          Accept{" "}
                          {currentUserAccepted ? "(Already accepted)" : ""}
                        </SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {messageType === "COUNTER_OFFER" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceOffer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Offer</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            min="0"
                            max="999999"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <CurrencySelector
                            value={field.value ?? "emeralds"}
                            onValueChange={field.onChange}
                            placeholder="Select currency"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your message..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                {messageType === "ACCEPT" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={isLoading || currentUserAccepted}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept Negotiation
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Accept Negotiation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to accept this negotiation? This
                          action cannot be undone.
                          {!requesterAccepted || !offererAccepted
                            ? " The negotiation will be completed when both parties accept."
                            : " Both parties have already agreed, so this will finalize the negotiation."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={form.handleSubmit(onSubmit)}
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Accept
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : messageType === "REJECT" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isLoading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Negotiation
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Negotiation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this negotiation? This
                          will end the negotiation and return the request to
                          open status.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={form.handleSubmit(onSubmit)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Message
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}

        {isNegotiationComplete && (
          <div className="text-muted-foreground py-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              {negotiation.status === "AGREED" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Negotiation{" "}
                {negotiation.status === "AGREED" ? "Completed" : "Failed"}
              </span>
            </div>
            <p className="text-sm">
              {negotiation.status === "AGREED"
                ? "Both parties have agreed to the terms."
                : "The negotiation was rejected by one of the parties."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
