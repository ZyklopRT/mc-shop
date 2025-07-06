"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
import { CurrencySelector } from "~/components/shops/currency-selector";
import { Send, Loader2 } from "lucide-react";
import {
  getMinimumInCurrency,
  formatCurrencyWithRate,
} from "~/lib/utils/currency-conversion";
import { useTranslations } from "next-intl";

const messageFormSchema = z
  .object({
    messageType: z.enum(["MESSAGE", "COUNTER_OFFER", "ACCEPT", "REJECT"]),
    content: z.string().min(1, "Message content is required").max(500),
    priceOffer: z.coerce.number().min(0).max(999999).optional(),
    currency: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.messageType === "COUNTER_OFFER") {
        return (
          data.currency === "emeralds" || data.currency === "emerald_blocks"
        );
      }
      return true;
    },
    {
      message: "Currency must be emeralds or emerald_blocks for counter-offers",
      path: ["currency"],
    },
  )
  .refine(
    (data) => {
      if (data.messageType === "COUNTER_OFFER") {
        return data.priceOffer !== undefined && data.priceOffer > 0;
      }
      return true;
    },
    {
      message: "Price offer is required for counter-offers",
      path: ["priceOffer"],
    },
  );

type MessageFormData = z.infer<typeof messageFormSchema>;

interface NegotiationFormProps {
  negotiationId: string;
  isNegotiationComplete: boolean;
  currentUserAccepted: boolean;
  otherPartyAccepted: boolean;
  currentOfferPrice?: number | null;
  currentOfferCurrency?: string;
  onSubmit: (
    formData: FormData,
  ) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

export function NegotiationForm({
  negotiationId,
  isNegotiationComplete,
  currentUserAccepted,
  otherPartyAccepted,
  currentOfferPrice,
  currentOfferCurrency,
  onSubmit,
  className = "",
}: NegotiationFormProps) {
  const t = useTranslations("component.negotiation-form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      messageType: "MESSAGE",
      content: "",
      priceOffer: undefined,
      currency: "emeralds", // Set default currency instead of undefined
    },
  });

  const messageType = form.watch("messageType");
  const selectedCurrency = form.watch("currency");

  // Calculate current offer in selected currency for reference
  const effectiveSelectedCurrency = selectedCurrency ?? "emeralds";
  const currentOfferInSelectedCurrency =
    currentOfferPrice && currentOfferCurrency && effectiveSelectedCurrency
      ? getMinimumInCurrency(
          currentOfferPrice,
          currentOfferCurrency,
          effectiveSelectedCurrency,
        )
      : (currentOfferPrice ?? 0);

  const handleSubmit = async (data: MessageFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("negotiationId", negotiationId);
      formData.append("messageType", data.messageType);
      formData.append("content", data.content);

      if (data.priceOffer !== undefined) {
        formData.append("priceOffer", data.priceOffer.toString());
      }

      if (data.currency) {
        formData.append("currency", data.currency);
      }

      // Include validation context for counter-offers
      if (data.messageType === "COUNTER_OFFER") {
        if (currentOfferPrice !== undefined && currentOfferPrice !== null) {
          formData.append("originalPrice", currentOfferPrice.toString());
        }
        if (currentOfferCurrency) {
          formData.append("originalCurrency", currentOfferCurrency);
        }
      }

      const result = await onSubmit(formData);

      if (result.success) {
        form.reset({
          messageType: "MESSAGE",
          content: "",
          priceOffer: undefined,
          currency: "emeralds",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show form if negotiation is complete
  if (isNegotiationComplete) {
    return null;
  }

  return (
    <div className={`border-t pt-4 ${className}`}>
      {/* Show helpful message when other party has accepted */}
      {otherPartyAccepted && !currentUserAccepted && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
            <div className="text-sm">
              <p className="font-medium text-blue-800">
                {t("otherPartyAccepted")}
              </p>
              <p className="text-blue-600">
                {t("otherPartyAcceptedDescription")}
              </p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Message Type Selector */}
          <FormField
            control={form.control}
            name="messageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("messageType")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectMessageType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MESSAGE">
                      {t("regularMessage")}
                    </SelectItem>
                    {!otherPartyAccepted && (
                      <SelectItem value="COUNTER_OFFER">
                        {t("counterOffer")}
                      </SelectItem>
                    )}
                    {!currentUserAccepted && (
                      <SelectItem value="ACCEPT">{t("acceptTerms")}</SelectItem>
                    )}
                    <SelectItem value="REJECT">
                      {t("rejectEndNegotiation")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price fields for counter-offers */}
          {messageType === "COUNTER_OFFER" && (
            <>
              <FormField
                control={form.control}
                name="priceOffer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("counterOfferPrice")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        max="999999"
                        placeholder={t("enterCounterOffer")}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : parseFloat(value),
                          );
                        }}
                      />
                    </FormControl>
                    {currentOfferPrice && currentOfferPrice > 0 && (
                      <div className="text-muted-foreground mt-1 text-sm">
                        <div className="flex items-center gap-1">
                          <span>💡</span>
                          <span>
                            {currentOfferCurrency &&
                            effectiveSelectedCurrency &&
                            effectiveSelectedCurrency !==
                              currentOfferCurrency ? (
                              <>
                                {t("currentOffer")}:{" "}
                                {formatCurrencyWithRate(
                                  currentOfferPrice,
                                  currentOfferCurrency,
                                )}{" "}
                                = {currentOfferInSelectedCurrency.toFixed(2)}{" "}
                                {effectiveSelectedCurrency === "emerald_blocks"
                                  ? "Emerald Blocks"
                                  : "Emeralds"}
                              </>
                            ) : (
                              <>
                                {t("currentOffer")}:{" "}
                                {formatCurrencyWithRate(
                                  currentOfferPrice,
                                  currentOfferCurrency ?? "emeralds",
                                )}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("currency")}</FormLabel>
                    <FormControl>
                      <CurrencySelector
                        value={field.value ?? "emeralds"}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Message content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {messageType === "COUNTER_OFFER"
                    ? t("counterOfferDetails")
                    : messageType === "ACCEPT"
                      ? t("acceptanceMessage")
                      : messageType === "REJECT"
                        ? t("rejectionReason")
                        : t("message")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      messageType === "COUNTER_OFFER"
                        ? t("explainCounterOffer")
                        : messageType === "ACCEPT"
                          ? t("confirmAcceptance")
                          : messageType === "REJECT"
                            ? t("explainRejection")
                            : t("typeYourMessage")
                    }
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting || isNegotiationComplete}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {messageType === "COUNTER_OFFER"
              ? t("sendCounterOffer")
              : messageType === "ACCEPT"
                ? t("acceptTermsButton")
                : messageType === "REJECT"
                  ? t("rejectEnd")
                  : t("sendMessage")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
