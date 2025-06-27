"use server";

import { revalidatePath } from "next/cache";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { updateOfferSchema } from "~/lib/validations/request";
import type { RequestActionResult } from "~/lib/types/request";

export async function updateOffer(
  formData: FormData,
): Promise<RequestActionResult<{ offerId: string; status: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update an offer",
      };
    }

    // Validate form data
    const validatedFields = updateOfferSchema.safeParse({
      offerId: formData.get("offerId"),
      status: formData.get("status"),
    });

    if (!validatedFields.success) {
      return { success: false, error: "Invalid form data" };
    }

    const { offerId, status } = validatedFields.data;

    // Get the offer with request and user details
    const offer = await db.requestOffer.findUnique({
      where: { id: offerId },
      include: {
        request: {
          select: {
            id: true,
            requesterId: true,
            status: true,
            title: true,
          },
        },
        offerer: {
          select: {
            id: true,
            mcUsername: true,
          },
        },
      },
    });

    if (!offer) {
      return { success: false, error: "Offer not found" };
    }

    // Check permissions based on the action
    const isRequester = offer.request.requesterId === session.user.id;
    const isOfferer = offer.offererId === session.user.id;

    if (status === "ACCEPTED" || status === "REJECTED") {
      // Only the request owner can accept or reject offers
      if (!isRequester) {
        return {
          success: false,
          error: "Only the request owner can accept or reject offers",
        };
      }
    } else if (status === "WITHDRAWN") {
      // Only the offer maker can withdraw their offer
      if (!isOfferer) {
        return {
          success: false,
          error: "You can only withdraw your own offers",
        };
      }
    }

    // Check if offer is in a valid state for the requested transition
    if (offer.status !== "PENDING") {
      return { success: false, error: "This offer can no longer be modified" };
    }

    // Check if request is still in valid state
    if (offer.request.status !== "OPEN" && status !== "WITHDRAWN") {
      return {
        success: false,
        error: "This request is no longer accepting offer updates",
      };
    }

    // Start a transaction to update offer and potentially request status
    const result = await db.$transaction(async (tx) => {
      // Update the offer
      const updatedOffer = await tx.requestOffer.update({
        where: { id: offerId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // If offer is accepted, update request status and reject other pending offers
      if (status === "ACCEPTED") {
        // Update request status to IN_NEGOTIATION
        await tx.request.update({
          where: { id: offer.request.id },
          data: { status: "IN_NEGOTIATION" },
        });

        // Reject all other pending offers on this request
        await tx.requestOffer.updateMany({
          where: {
            requestId: offer.request.id,
            id: { not: offerId },
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        });

        // Create negotiation record
        await tx.requestNegotiation.create({
          data: {
            requestId: offer.request.id,
            acceptedOfferId: offerId,
            finalPrice: offer.offeredPrice,
            status: "IN_PROGRESS",
          },
        });
      }

      return updatedOffer;
    });

    // Revalidate relevant paths to update the UI
    revalidatePath(`/requests/${offer.request.id}`);
    revalidatePath("/requests");

    return {
      success: true,
      data: { offerId: result.id, status: result.status },
    };
  } catch (error) {
    console.error("Error updating offer:", error);
    return { success: false, error: "Failed to update offer" };
  }
}
