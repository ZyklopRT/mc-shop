import { z } from "zod";

// Create request validation
export const createRequestSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(1000, "Description must be at most 1000 characters"),
    requestType: z.enum(["ITEM", "GENERAL"], {
      required_error: "Request type is required",
    }),
    itemId: z.string().optional(),
    itemQuantity: z
      .number()
      .min(1, "Quantity must be at least 1")
      .max(999999, "Quantity must be at most 999,999")
      .optional(),
    suggestedPrice: z
      .number()
      .min(0, "Price must be at least 0")
      .max(999999, "Price is too high")
      .optional(),
    currency: z.enum(["emeralds", "emerald_blocks"]).default("emeralds"),
  })
  .refine(
    (data) => {
      if (data.requestType === "ITEM") {
        return data.itemId && data.itemQuantity;
      }
      return true;
    },
    {
      message: "Item ID and quantity are required for item requests",
      path: ["itemId"],
    },
  );

// Update request validation
export const updateRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  suggestedPrice: z
    .number()
    .min(0, "Price must be at least 0")
    .max(999999, "Price is too high")
    .optional(),
  status: z.enum(["OPEN", "CANCELLED"]).optional(),
});

// Create offer validation
export const createOfferSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  offeredPrice: z
    .number()
    .min(0, "Price must be at least 0")
    .max(999999, "Price is too high")
    .optional(),
  currency: z.enum(["emeralds", "emerald_blocks"]).default("emeralds"),
  message: z
    .string()
    .max(500, "Message must be at most 500 characters")
    .optional(),
});

// Update offer validation
export const updateOfferSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"]),
});

// Negotiation message validation
export const negotiationMessageSchema = z
  .object({
    negotiationId: z.string().min(1, "Negotiation ID is required"),
    messageType: z.enum([
      "OFFER",
      "COUNTER_OFFER",
      "ACCEPT",
      "REJECT",
      "MESSAGE",
    ]),
    content: z
      .string()
      .min(1, "Message content is required")
      .max(500, "Message must be at most 500 characters"),
    priceOffer: z
      .number()
      .min(0, "Price must be at least 0")
      .max(999999, "Price is too high")
      .optional(),
    currency: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Only validate currency enum for counter-offers
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
      // Price offer is required for counter-offers
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

// For backwards compatibility, also create the sendNegotiationMessageSchema
export const sendNegotiationMessageSchema = negotiationMessageSchema;

// Search and listing validation
export const getRequestsSchema = z.object({
  status: z
    .enum(["OPEN", "IN_NEGOTIATION", "ACCEPTED", "COMPLETED", "CANCELLED"])
    .optional(),
  requestType: z.enum(["ITEM", "GENERAL"]).optional(),
  requesterId: z.string().optional(),
  itemId: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  orderBy: z
    .enum(["createdAt", "updatedAt", "suggestedPrice"])
    .default("createdAt"),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const searchRequestsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  requestType: z.enum(["ITEM", "GENERAL"]).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

// Get request details validation
export const getRequestDetailsSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
});

// Complete request validation
export const completeRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  negotiationId: z.string().min(1, "Negotiation ID is required"),
});

// Type exports
export type CreateRequestData = z.infer<typeof createRequestSchema>;
export type UpdateRequestData = z.infer<typeof updateRequestSchema>;
export type CreateOfferData = z.infer<typeof createOfferSchema>;
export type UpdateOfferData = z.infer<typeof updateOfferSchema>;
export type NegotiationMessageData = z.infer<typeof negotiationMessageSchema>;
export type GetRequestsData = z.infer<typeof getRequestsSchema>;
export type SearchRequestsData = z.infer<typeof searchRequestsSchema>;
export type GetRequestDetailsData = z.infer<typeof getRequestDetailsSchema>;
export type CompleteRequestData = z.infer<typeof completeRequestSchema>;
