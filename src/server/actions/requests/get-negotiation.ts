"use server";

import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import type {
  RequestActionResult,
  NegotiationWithDetails,
} from "~/lib/types/request";

const getNegotiationSchema = z.object({
  negotiationId: z.string().min(1, "Negotiation ID is required"),
});

export async function getNegotiation(data: {
  negotiationId: string;
}): Promise<RequestActionResult<{ negotiation: NegotiationWithDetails }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view negotiations",
      };
    }

    const { negotiationId } = getNegotiationSchema.parse(data);

    // Get negotiation with all details
    const negotiation = await db.requestNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        request: {
          include: {
            requester: { select: { id: true, mcUsername: true } },
            item: true,
          },
        },
        messages: {
          include: {
            sender: { select: { id: true, mcUsername: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!negotiation) {
      return { success: false, error: "Negotiation not found" };
    }

    // Get the accepted offer to determine the offerer
    const acceptedOffer = await db.requestOffer.findUnique({
      where: { id: negotiation.acceptedOfferId! },
      include: {
        offerer: { select: { id: true, mcUsername: true } },
      },
    });

    if (!acceptedOffer) {
      return { success: false, error: "Accepted offer not found" };
    }

    // Check if user is a participant in the negotiation
    const isRequester = session.user.id === negotiation.request.requester.id;
    const isOfferer = session.user.id === acceptedOffer.offerer.id;

    if (!isRequester && !isOfferer) {
      return {
        success: false,
        error: "You are not authorized to view this negotiation",
      };
    }

    const negotiationWithOffer = {
      ...negotiation,
      acceptedOffer,
    };

    return { success: true, data: { negotiation: negotiationWithOffer } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Get negotiation error:", error);
    return { success: false, error: "Failed to get negotiation" };
  }
}

export async function getNegotiationByRequestId(data: {
  requestId: string;
}): Promise<
  RequestActionResult<{ negotiation: NegotiationWithDetails | null }>
> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view negotiations",
      };
    }

    const requestId = data.requestId;

    // Get negotiation with all details
    const negotiation = await db.requestNegotiation.findUnique({
      where: { requestId },
      include: {
        request: {
          include: {
            requester: { select: { id: true, mcUsername: true } },
            item: true,
          },
        },
        messages: {
          include: {
            sender: { select: { id: true, mcUsername: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!negotiation) {
      return { success: true, data: { negotiation: null } };
    }

    // Get the accepted offer to determine the offerer
    const acceptedOffer = await db.requestOffer.findUnique({
      where: { id: negotiation.acceptedOfferId! },
      include: {
        offerer: { select: { id: true, mcUsername: true } },
      },
    });

    if (!acceptedOffer) {
      return { success: false, error: "Accepted offer not found" };
    }

    // Check if user is a participant in the negotiation
    const isRequester = session.user.id === negotiation.request.requester.id;
    const isOfferer = session.user.id === acceptedOffer.offerer.id;

    if (!isRequester && !isOfferer) {
      return {
        success: false,
        error: "You are not authorized to view this negotiation",
      };
    }

    const negotiationWithOffer = {
      ...negotiation,
      acceptedOffer,
    };

    return { success: true, data: { negotiation: negotiationWithOffer } };
  } catch (error) {
    console.error("Get negotiation by request ID error:", error);
    return { success: false, error: "Failed to get negotiation" };
  }
}
