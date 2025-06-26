"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { Loader2, Send } from "lucide-react";
import { createOfferSchema } from "~/lib/validations/request";
import { toast } from "sonner";
import type { CreateOfferData } from "~/lib/validations/request";

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

  const form = useForm<CreateOfferData>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      requestId,
      offeredPrice: suggestedPrice,
      message: "",
    },
  });

  const onSubmit = async (data: CreateOfferData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("requestId", data.requestId);

      if (data.offeredPrice !== undefined) {
        formData.append("offeredPrice", data.offeredPrice.toString());
      }

      if (data.message) {
        formData.append("message", data.message);
      }

      const result = await createOfferAction(formData);

      if (result.success) {
        toast.success("Your offer has been submitted successfully.");
        form.reset();
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
              name="offeredPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Offered Price ({getCurrencyDisplay(currency)})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={
                        suggestedPrice?.toString() ?? "Enter your offer"
                      }
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
