"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { completeRequestSchema } from "~/lib/validations/request";
import type { RequestActionResult } from "~/lib/types/request";

export async function completeRequest(
  formData: FormData,
): Promise<RequestActionResult<{ requestId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to complete requests",
      };
    }

    // Validate form data
    const validatedFields = completeRequestSchema.safeParse({
      requestId: formData.get("requestId"),
      negotiationId: formData.get("negotiationId"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid form data",
      };
    }

    const { requestId, negotiationId } = validatedFields.data;

    // Get request with negotiation details and accepted offer
    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        negotiation: {
          include: {
            request: {
              include: {
                offers: {
                  where: { status: "ACCEPTED" },
                  include: {
                    offerer: { select: { id: true, mcUsername: true } },
                  },
                },
              },
            },
          },
        },
        requester: { select: { id: true, mcUsername: true } },
      },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Find the accepted offer to get the offerer
    const acceptedOffer = request.negotiation?.request.offers.find(
      (offer) => offer.status === "ACCEPTED",
    );

    // Check if user is either the request owner OR the offerer whose offer was accepted
    const isRequester = request.requesterId === session.user.id;
    const isOfferer = acceptedOffer?.offerer.id === session.user.id;

    if (!isRequester && !isOfferer) {
      return {
        success: false,
        error:
          "Only the request owner or the accepted offerer can mark this as completed",
      };
    }

    // Check if request is in correct status
    if (request.status !== "ACCEPTED") {
      return {
        success: false,
        error: "Request must be in accepted status to be completed",
      };
    }

    // Check if negotiation exists and is agreed
    if (!request.negotiation || request.negotiation.status !== "AGREED") {
      return {
        success: false,
        error: "Negotiation must be agreed upon before completing the request",
      };
    }

    // Verify negotiation ID matches
    if (request.negotiation.id !== negotiationId) {
      return {
        success: false,
        error: "Invalid negotiation ID",
      };
    }

    // Update request and negotiation status in a transaction
    await db.$transaction(async (tx) => {
      // Update request status to COMPLETED
      await tx.request.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Update negotiation completion timestamp
      await tx.requestNegotiation.update({
        where: { id: negotiationId },
        data: {
          completedAt: new Date(),
        },
      });
    });

    return { success: true, data: { requestId } };
  } catch (error) {
    console.error("Error completing request:", error);
    return { success: false, error: "Failed to complete request" };
  }
}
