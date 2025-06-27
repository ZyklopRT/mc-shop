"use server";

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
      currency: formData.get("currency"),
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

    // Get the accepted offer to determine the offerer
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

    // Validate message type permissions
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
    }

    // Create the message
    const message = await db.negotiationMessage.create({
      data: {
        negotiationId,
        senderId: session.user.id,
        messageType,
        content,
        priceOffer,
      },
    });

    // If currency is provided for counter offers, update the request's currency
    if (messageType === "COUNTER_OFFER" && currency) {
      await db.request.update({
        where: { id: negotiation.request.id },
        data: { currency },
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

    return { success: true, data: { messageId: message.id } };
  } catch (error) {
    console.error("Error sending negotiation message:", error);
    return { success: false, error: "Failed to send message" };
  }
}
