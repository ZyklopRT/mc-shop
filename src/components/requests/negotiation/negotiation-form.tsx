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
  onSubmit: (
    formData: FormData,
  ) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

export function NegotiationForm({
  negotiationId,
  isNegotiationComplete,
  currentUserAccepted,
  onSubmit,
  className = "",
}: NegotiationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      messageType: "MESSAGE",
      content: "",
      priceOffer: undefined,
      currency: undefined,
    },
  });

  const messageType = form.watch("messageType");

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

      const result = await onSubmit(formData);

      if (result.success) {
        form.reset({
          messageType: "MESSAGE",
          content: "",
          priceOffer: undefined,
          currency: undefined,
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Message Type Selector */}
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
                    <SelectItem value="MESSAGE">Regular Message</SelectItem>
                    <SelectItem value="COUNTER_OFFER">Counter Offer</SelectItem>
                    {!currentUserAccepted && (
                      <SelectItem value="ACCEPT">Accept Terms</SelectItem>
                    )}
                    <SelectItem value="REJECT">
                      Reject & End Negotiation
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
                    <FormLabel>Counter Offer Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="999999"
                        placeholder="Enter your counter offer..."
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined,
                          )
                        }
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
                    ? "Counter Offer Details"
                    : messageType === "ACCEPT"
                      ? "Acceptance Message"
                      : messageType === "REJECT"
                        ? "Rejection Reason"
                        : "Message"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      messageType === "COUNTER_OFFER"
                        ? "Explain your counter offer..."
                        : messageType === "ACCEPT"
                          ? "Confirm your acceptance..."
                          : messageType === "REJECT"
                            ? "Explain why you're rejecting..."
                            : "Type your message..."
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
              ? "Send Counter Offer"
              : messageType === "ACCEPT"
                ? "Accept Terms"
                : messageType === "REJECT"
                  ? "Reject & End"
                  : "Send Message"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
