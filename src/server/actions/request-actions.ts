"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import {
  createRequestSchema,
  updateRequestSchema,
  createOfferSchema,
  updateOfferSchema,
  negotiationMessageSchema,
  getRequestsSchema,
  searchRequestsSchema,
  getRequestDetailsSchema,
  completeRequestSchema,
  type CreateRequestData,
  type UpdateRequestData,
  type CreateOfferData,
  type UpdateOfferData,
  type NegotiationMessageData,
  type GetRequestsData,
  type SearchRequestsData,
  type GetRequestDetailsData,
  type CompleteRequestData,
} from "~/lib/validations/request";
import type {
  RequestWithDetails,
  RequestListResponse,
  RequestDetailsResponse,
} from "~/lib/types/request";

// Action result type (following your pattern)
type RequestActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Create a new request
 */
export async function createRequest(
  data: CreateRequestData,
): Promise<RequestActionResult<RequestWithDetails>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createRequestSchema.parse(data);

    // If it's an item request, verify the item exists
    if (validatedData.requestType === "ITEM" && validatedData.itemId) {
      const itemExists = await db.minecraftItem.findUnique({
        where: { id: validatedData.itemId },
      });

      if (!itemExists) {
        return { success: false, error: "Selected item not found" };
      }
    }

    const request = await db.request.create({
      data: {
        ...validatedData,
        requesterId: session.user.id,
      },
      include: {
        requester: { select: { mcUsername: true, id: true } },
        item: true,
        _count: { select: { offers: true } },
      },
    });

    return { success: true, data: request };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Create request error:", error);
    return { success: false, error: "Failed to create request" };
  }
}

/**
 * Update an existing request
 */
export async function updateRequest(
  data: UpdateRequestData,
): Promise<RequestActionResult<RequestWithDetails>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { requestId, ...updateData } = updateRequestSchema.parse(data);

    // Verify request exists and user owns it
    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return { success: false, error: "Request not found" };
    }

    if (existingRequest.requesterId !== session.user.id) {
      return { success: false, error: "Not authorized to update this request" };
    }

    // Only allow updates if request is OPEN or CANCELLED
    if (!["OPEN", "CANCELLED"].includes(existingRequest.status)) {
      return {
        success: false,
        error: "Cannot update request in current status",
      };
    }

    const request = await db.request.update({
      where: { id: requestId },
      data: updateData,
      include: {
        requester: { select: { mcUsername: true, id: true } },
        item: true,
        _count: { select: { offers: true } },
      },
    });

    return { success: true, data: request };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Update request error:", error);
    return { success: false, error: "Failed to update request" };
  }
}

/**
 * Create an offer for a request
 */
export async function createOffer(
  data: CreateOfferData,
): Promise<RequestActionResult<unknown>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createOfferSchema.parse(data);

    // Verify request exists and is open
    const request = await db.request.findUnique({
      where: { id: validatedData.requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.status !== "OPEN") {
      return { success: false, error: "Request is no longer accepting offers" };
    }

    if (request.requesterId === session.user.id) {
      return { success: false, error: "Cannot offer on your own request" };
    }

    // Check if user already has a pending offer
    const existingOffer = await db.requestOffer.findFirst({
      where: {
        requestId: validatedData.requestId,
        offererId: session.user.id,
        status: "PENDING",
      },
    });

    if (existingOffer) {
      return {
        success: false,
        error: "You already have a pending offer on this request",
      };
    }

    const offer = await db.requestOffer.create({
      data: {
        ...validatedData,
        offererId: session.user.id,
      },
      include: {
        offerer: { select: { mcUsername: true, id: true } },
        request: { select: { title: true, requesterId: true } },
      },
    });

    return { success: true, data: offer };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Create offer error:", error);
    return { success: false, error: "Failed to create offer" };
  }
}

/**
 * Update offer status (accept, reject, withdraw)
 */
export async function updateOfferStatus(
  data: UpdateOfferData,
): Promise<RequestActionResult<unknown>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { offerId, status } = updateOfferSchema.parse(data);

    const offer = await db.requestOffer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });

    if (!offer) {
      return { success: false, error: "Offer not found" };
    }

    // Check permissions based on action
    if (status === "WITHDRAWN") {
      if (offer.offererId !== session.user.id) {
        return {
          success: false,
          error: "Only the offerer can withdraw an offer",
        };
      }
    } else if (["ACCEPTED", "REJECTED"].includes(status)) {
      if (offer.request.requesterId !== session.user.id) {
        return {
          success: false,
          error: "Only the requester can accept or reject offers",
        };
      }
    }

    if (offer.status !== "PENDING") {
      return { success: false, error: "Offer is no longer pending" };
    }

    // Handle acceptance - start negotiation
    if (status === "ACCEPTED") {
      const result = await db.$transaction(async (tx) => {
        // Update request status
        await tx.request.update({
          where: { id: offer.requestId },
          data: { status: "IN_NEGOTIATION" },
        });

        // Update offer status
        const updatedOffer = await tx.requestOffer.update({
          where: { id: offerId },
          data: { status },
          include: {
            offerer: { select: { mcUsername: true, id: true } },
            request: { select: { title: true, requesterId: true } },
          },
        });

        // Reject other pending offers
        await tx.requestOffer.updateMany({
          where: {
            requestId: offer.requestId,
            id: { not: offerId },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        });

        // Create negotiation
        await tx.requestNegotiation.create({
          data: {
            requestId: offer.requestId,
            acceptedOfferId: offerId,
            finalPrice: offer.offeredPrice ?? offer.request.suggestedPrice,
          },
        });

        return updatedOffer;
      });

      return { success: true, data: result };
    } else {
      // Simple status update for rejection or withdrawal
      const updatedOffer = await db.requestOffer.update({
        where: { id: offerId },
        data: { status },
        include: {
          offerer: { select: { mcUsername: true, id: true } },
          request: { select: { title: true, requesterId: true } },
        },
      });

      return { success: true, data: updatedOffer };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Update offer status error:", error);
    return { success: false, error: "Failed to update offer status" };
  }
}

/**
 * Get requests with filtering and pagination
 */
export async function getRequests(
  data: GetRequestsData,
): Promise<RequestActionResult<RequestListResponse>> {
  try {
    const validatedData = getRequestsSchema.parse(data);
    const { limit, offset, orderBy, orderDirection, ...filters } =
      validatedData;

    // Build where clause
    const where: Record<string, unknown> = {
      ...(filters.status && { status: filters.status }),
      ...(filters.requestType && { requestType: filters.requestType }),
      ...(filters.requesterId && { requesterId: filters.requesterId }),
      ...(filters.itemId && { itemId: filters.itemId }),
    };

    const orderClause = { [orderBy]: orderDirection };

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          requester: { select: { mcUsername: true, id: true } },
          item: true,
          _count: { select: { offers: true } },
        },
        orderBy: orderClause,
        take: limit,
        skip: offset,
      }),
      db.request.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        requests,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Get requests error:", error);
    return { success: false, error: "Failed to get requests" };
  }
}

/**
 * Get request details with full information
 */
export async function getRequestDetails(
  data: GetRequestDetailsData,
): Promise<RequestActionResult<RequestDetailsResponse>> {
  try {
    const { requestId } = getRequestDetailsSchema.parse(data);

    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { mcUsername: true, id: true } },
        item: true,
        offers: {
          include: {
            offerer: { select: { mcUsername: true, id: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        negotiation: {
          include: {
            messages: {
              include: {
                sender: { select: { mcUsername: true, id: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    return { success: true, data: { request } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Get request details error:", error);
    return { success: false, error: "Failed to get request details" };
  }
}

/**
 * Search requests by title and description
 */
export async function searchRequests(
  data: SearchRequestsData,
): Promise<RequestActionResult<unknown>> {
  try {
    const { query, requestType, limit, offset } =
      searchRequestsSchema.parse(data);

    const where: Record<string, unknown> = {
      AND: [
        { status: "OPEN" }, // Only search open requests
        {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        ...(requestType ? [{ requestType }] : []),
      ],
    };

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          requester: { select: { mcUsername: true, id: true } },
          item: { select: { id: true, nameEn: true, filename: true } },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.request.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        requests,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Search requests error:", error);
    return { success: false, error: "Failed to search requests" };
  }
}

/**
 * Add a negotiation message
 */
export async function addNegotiationMessage(
  data: NegotiationMessageData,
): Promise<RequestActionResult<unknown>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = negotiationMessageSchema.parse(data);

    // Verify negotiation exists and user is part of it
    const negotiation = await db.requestNegotiation.findUnique({
      where: { id: validatedData.negotiationId },
      include: {
        request: {
          include: {
            offers: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
    });

    if (!negotiation) {
      return { success: false, error: "Negotiation not found" };
    }

    const acceptedOffer = negotiation.request.offers[0];
    if (!acceptedOffer) {
      return { success: false, error: "No accepted offer found" };
    }

    // Check if user is either the requester or the offerer
    const isRequester = negotiation.request.requesterId === session.user.id;
    const isOfferer = acceptedOffer.offererId === session.user.id;

    if (!isRequester && !isOfferer) {
      return {
        success: false,
        error: "Not authorized to participate in this negotiation",
      };
    }

    // Handle special message types
    if (validatedData.messageType === "ACCEPT") {
      // Complete the request
      await db.$transaction(async (tx) => {
        await tx.request.update({
          where: { id: negotiation.requestId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        await tx.requestNegotiation.update({
          where: { id: validatedData.negotiationId },
          data: {
            status: "AGREED",
            completedAt: new Date(),
          },
        });
      });
    }

    const message = await db.negotiationMessage.create({
      data: {
        ...validatedData,
        senderId: session.user.id,
      },
      include: {
        sender: { select: { mcUsername: true, id: true } },
      },
    });

    return { success: true, data: message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Add negotiation message error:", error);
    return { success: false, error: "Failed to add negotiation message" };
  }
}

/**
 * Complete a request (mark as fulfilled)
 */
export async function completeRequest(
  data: CompleteRequestData,
): Promise<RequestActionResult<unknown>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const { requestId, negotiationId } = completeRequestSchema.parse(data);

    // Verify negotiation exists and user has permission
    const negotiation = await db.requestNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        request: {
          include: {
            offers: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
    });

    if (!negotiation || negotiation.requestId !== requestId) {
      return { success: false, error: "Negotiation not found" };
    }

    const acceptedOffer = negotiation.request.offers[0];
    if (!acceptedOffer) {
      return { success: false, error: "No accepted offer found" };
    }

    // Check if user is either the requester or the offerer
    const isRequester = negotiation.request.requesterId === session.user.id;
    const isOfferer = acceptedOffer.offererId === session.user.id;

    if (!isRequester && !isOfferer) {
      return {
        success: false,
        error: "Not authorized to complete this request",
      };
    }

    const result = await db.$transaction(async (tx) => {
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          requester: { select: { mcUsername: true, id: true } },
          item: true,
        },
      });

      await tx.requestNegotiation.update({
        where: { id: negotiationId },
        data: {
          status: "AGREED",
          completedAt: new Date(),
        },
      });

      return updatedRequest;
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Complete request error:", error);
    return { success: false, error: "Failed to complete request" };
  }
}

/**
 * Delete a request and all associated data
 */
export async function deleteRequest(
  requestId: string,
): Promise<RequestActionResult<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify request exists and user owns it
    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return { success: false, error: "Request not found" };
    }

    if (existingRequest.requesterId !== session.user.id) {
      return { success: false, error: "Not authorized to delete this request" };
    }

    // Delete the request and all associated data using cascading deletes
    await db.request.delete({
      where: { id: requestId },
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("Delete request error:", error);
    return { success: false, error: "Failed to delete request" };
  }
}
