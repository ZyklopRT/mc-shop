"use server";

import { revalidatePath } from "next/cache";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { negotiationMessageSchema } from "~/lib/validations/request";
import type { RequestActionResult } from "~/lib/types/request";

export async function sendNegotiationMessage(
  formData: FormData,
): Promise<RequestActionResult<{ messageId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to send messages",
      };
    }

    // Validate form data
    const validatedFields = negotiationMessageSchema.safeParse({
      negotiationId: formData.get("negotiationId"),
      messageType: formData.get("messageType"),
      content: formData.get("content"),
      priceOffer: formData.get("priceOffer")
        ? Number(formData.get("priceOffer"))
        : undefined,
      currency: formData.get("currency") ?? undefined,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid form data",
      };
    }

    const { negotiationId, messageType, content, priceOffer, currency } =
      validatedFields.data;

    // Get negotiation details with request and participants
    const negotiation = await db.requestNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        request: {
          include: {
            requester: { select: { id: true } },
          },
        },
      },
    });

    if (!negotiation) {
      return { success: false, error: "Negotiation not found" };
    }

    // Check if negotiation is still active
    if (negotiation.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "This negotiation is no longer active",
      };
    }

    // Get the accepted offer to determine the offerer and get original offer details
    const acceptedOffer = await db.requestOffer.findUnique({
      where: { id: negotiation.acceptedOfferId! },
      include: {
        offerer: { select: { id: true } },
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
        error: "You are not authorized to participate in this negotiation",
      };
    }

    // Validate message type permissions and prepare acceptance data
    let finalPriceOffer = priceOffer;
    let finalCurrency = currency;

    if (messageType === "ACCEPT") {
      // Both parties can accept, but we need to check if both have accepted
      const existingAcceptMessage = await db.negotiationMessage.findFirst({
        where: {
          negotiationId,
          senderId: session.user.id,
          messageType: "ACCEPT",
        },
      });

      if (existingAcceptMessage) {
        return {
          success: false,
          error: "You have already accepted this negotiation",
        };
      }

      // If no counter-offers have been made, use the original accepted offer details
      const hasCounterOffers = await db.negotiationMessage.findFirst({
        where: {
          negotiationId,
          messageType: "COUNTER_OFFER",
        },
      });

      if (!hasCounterOffers) {
        // Use the original accepted offer's price and currency
        finalPriceOffer = acceptedOffer.offeredPrice ?? undefined;
        // Ensure currency is valid, fallback to emeralds if invalid
        const offerCurrency = acceptedOffer.currency;
        if (
          offerCurrency === "emeralds" ||
          offerCurrency === "emerald_blocks"
        ) {
          finalCurrency = offerCurrency;
        } else {
          finalCurrency = "emeralds"; // Safe fallback
        }
      } else {
        // If there are counter-offers, use the most recent one
        const lastCounterOffer = await db.negotiationMessage.findFirst({
          where: {
            negotiationId,
            messageType: "COUNTER_OFFER",
          },
          orderBy: { createdAt: "desc" },
        });

        if (lastCounterOffer) {
          finalPriceOffer = lastCounterOffer.priceOffer ?? undefined;
          // Get the currency from the request (updated by the last counter-offer)
          finalCurrency = negotiation.request.currency as
            | "emeralds"
            | "emerald_blocks"
            | undefined;
        }
      }
    }

    // Create the message
    const message = await db.negotiationMessage.create({
      data: {
        negotiationId,
        senderId: session.user.id,
        messageType,
        content,
        priceOffer: finalPriceOffer,
      },
    });

    // If currency is provided for counter offers, update the request's currency
    if (messageType === "COUNTER_OFFER" && finalCurrency) {
      await db.request.update({
        where: { id: negotiation.request.id },
        data: { currency: finalCurrency },
      });
    }

    // If accepting and using original offer currency, update request currency to match
    if (
      messageType === "ACCEPT" &&
      finalCurrency &&
      finalCurrency !== negotiation.request.currency
    ) {
      await db.request.update({
        where: { id: negotiation.request.id },
        data: { currency: finalCurrency },
      });
    }

    // If this is an ACCEPT message, check if both parties have accepted
    if (messageType === "ACCEPT") {
      const otherPartyAcceptMessage = await db.negotiationMessage.findFirst({
        where: {
          negotiationId,
          senderId: isRequester
            ? acceptedOffer.offerer.id
            : negotiation.request.requester.id,
          messageType: "ACCEPT",
        },
      });

      // If both parties have accepted, update negotiation and request status
      if (otherPartyAcceptMessage) {
        await db.$transaction(async (tx) => {
          // Update negotiation status to AGREED
          await tx.requestNegotiation.update({
            where: { id: negotiationId },
            data: {
              status: "AGREED",
              completedAt: new Date(),
            },
          });

          // Update request status to ACCEPTED
          await tx.request.update({
            where: { id: negotiation.request.id },
            data: { status: "ACCEPTED" },
          });
        });
      }
    } else if (messageType === "REJECT") {
      // If either party rejects, mark negotiation as failed
      await db.requestNegotiation.update({
        where: { id: negotiationId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
        },
      });

      // Update request status back to OPEN
      await db.request.update({
        where: { id: negotiation.request.id },
        data: { status: "OPEN" },
      });
    }

    // Revalidate relevant paths to update the UI
    revalidatePath(`/requests/${negotiation.request.id}`);
    revalidatePath("/requests");

    return { success: true, data: { messageId: message.id } };
  } catch (error) {
    console.error("Error sending negotiation message:", error);
    return { success: false, error: "Failed to send message" };
  }
}
