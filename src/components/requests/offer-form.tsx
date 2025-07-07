"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { CurrencySelector } from "~/components/shops/currency-selector";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Loader2, Send } from "lucide-react";
import { createOfferSchema } from "~/lib/validations/request";
import { toast } from "sonner";
import type { CreateOfferData } from "~/lib/validations/request";
import {
  getMinimumInCurrency,
  formatCurrencyWithRate,
} from "~/lib/utils/currency-conversion";
import { useTranslations } from "next-intl";

interface OfferFormProps {
  requestId: string;
  suggestedPrice?: number;
  currency: string;
  onOfferCreated?: () => void;
  disabled?: boolean;
  createOfferAction: (formData: FormData) => Promise<{
    success: boolean;
    error?: string;
    data?: { offerId: string };
  }>;
}

export function OfferForm({
  requestId,
  suggestedPrice,
  currency,
  onOfferCreated,
  disabled = false,
  createOfferAction,
}: OfferFormProps) {
  const t = useTranslations("component.offer-form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      requestId,
      offeredPrice: undefined, // Don't prefill - let user enter their own value
      currency: (currency as "emeralds" | "emerald_blocks") || "emeralds",
      message: "",
      suggestedPrice,
      suggestedCurrency: currency,
    },
  });

  // Display suggested price in current currency for reference
  const currentCurrency = form.watch("currency");
  const suggestedInCurrentCurrency =
    suggestedPrice && currency
      ? getMinimumInCurrency(
          suggestedPrice,
          currency,
          currentCurrency ?? "emeralds",
        )
      : 0;

  const onSubmit = async (data: CreateOfferData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("requestId", data.requestId);

      if (data.offeredPrice !== undefined) {
        formData.append("offeredPrice", data.offeredPrice.toString());
      }

      formData.append("currency", data.currency);

      if (data.message) {
        formData.append("message", data.message);
      }

      // Include validation context
      if (data.suggestedPrice !== undefined) {
        formData.append("suggestedPrice", data.suggestedPrice.toString());
      }
      if (data.suggestedCurrency) {
        formData.append("suggestedCurrency", data.suggestedCurrency);
      }

      const result = await createOfferAction(formData);

      if (result.success) {
        toast.success(t("offerSubmittedSuccessfully"));
        form.reset({
          requestId,
          offeredPrice: undefined,
          currency: (currency as "emeralds" | "emerald_blocks") || "emeralds",
          message: "",
          suggestedPrice,
          suggestedCurrency: currency,
        });
        onOfferCreated?.();
      } else {
        toast.error(result.error ?? t("failedToSubmitOffer"));
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error(t("failedToSubmitOfferTryAgain"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrencyDisplay = (currencyType: string) => {
    switch (currencyType) {
      case "emerald_blocks":
        return t("emeraldBlocks");
      case "emeralds":
      default:
        return t("emeralds");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          {t("makeAnOffer")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      disabled={disabled || isSubmitting}
                      placeholder={t("selectCurrency")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offeredPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("offeredPrice")} (
                    {getCurrencyDisplay(form.watch("currency") ?? "emeralds")})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t("enterYourOffer")}
                      disabled={disabled || isSubmitting}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : Number(value),
                        );
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  {suggestedPrice && suggestedPrice > 0 && (
                    <div className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <span>💡</span>
                        <span>
                          {currency &&
                          currentCurrency &&
                          currentCurrency !== currency ? (
                            <>
                              {t("suggested")}:{" "}
                              {formatCurrencyWithRate(suggestedPrice, currency)}{" "}
                              ={suggestedInCurrentCurrency.toFixed(2)}{" "}
                              {getCurrencyDisplay(currentCurrency)}
                            </>
                          ) : (
                            <>
                              {t("suggested")}: {suggestedPrice.toFixed(2)}{" "}
                              {getCurrencyDisplay(
                                currentCurrency ?? "emeralds",
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("messageOptional")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("addMessageToOffer")}
                      disabled={disabled || isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={disabled || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submittingOffer")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("submitOffer")}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
