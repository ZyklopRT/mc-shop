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
        toast.success("Your offer has been submitted successfully.");
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
        toast.error(result.error ?? "Failed to submit offer");
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Failed to submit offer. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Make an Offer
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
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <CurrencySelector
                      value={field.value ?? "emeralds"}
                      onValueChange={field.onChange}
                      disabled={disabled || isSubmitting}
                      placeholder="Select currency"
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
                    Offered Price (
                    {getCurrencyDisplay(form.watch("currency") ?? "emeralds")})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter your offer"
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
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>💡</span>
                        <span>
                          {currency &&
                          currentCurrency &&
                          currentCurrency !== currency ? (
                            <>
                              Suggested:{" "}
                              {formatCurrencyWithRate(suggestedPrice, currency)}{" "}
                              ={suggestedInCurrentCurrency.toFixed(2)}{" "}
                              {getCurrencyDisplay(currentCurrency)}
                            </>
                          ) : (
                            <>
                              Suggested: {suggestedPrice.toFixed(2)}{" "}
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
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a message to your offer..."
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
                  Submitting Offer...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Offer
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
