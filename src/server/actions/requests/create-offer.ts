"use server";

import { revalidatePath } from "next/cache";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { createOfferSchema } from "~/lib/validations/request";
import type { RequestActionResult } from "~/lib/types/request";

export async function createOffer(
  formData: FormData,
): Promise<RequestActionResult<{ offerId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to make an offer",
      };
    }

    // Validate form data
    const validatedFields = createOfferSchema.safeParse({
      requestId: formData.get("requestId"),
      offeredPrice: formData.get("offeredPrice")
        ? Number(formData.get("offeredPrice"))
        : undefined,
      currency: formData.get("currency") ?? "emeralds",
      message: formData.get("message") ?? undefined,
      suggestedPrice: formData.get("suggestedPrice")
        ? Number(formData.get("suggestedPrice"))
        : undefined,
      suggestedCurrency: formData.get("suggestedCurrency") ?? undefined,
    });

    if (!validatedFields.success) {
      return { success: false, error: "Invalid form data" };
    }

    const { requestId, offeredPrice, currency, message } = validatedFields.data;

    // Check if request exists and is available for offers
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        status: true,
        title: true,
      },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Check if user is trying to offer on their own request
    if (request.requesterId === session.user.id) {
      return {
        success: false,
        error: "You cannot make an offer on your own request",
      };
    }

    // Check if request is still open for offers
    if (request.status !== "OPEN") {
      return {
        success: false,
        error: "This request is no longer accepting offers",
      };
    }

    // Check if user already has a pending offer on this request
    const existingOffer = await db.requestOffer.findFirst({
      where: {
        requestId,
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

    // Create the offer
    const offer = await db.requestOffer.create({
      data: {
        requestId,
        offererId: session.user.id,
        offeredPrice,
        currency,
        message,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    // Revalidate relevant paths to update the UI
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");

    return { success: true, data: { offerId: offer.id } };
  } catch (error) {
    console.error("Error creating offer:", error);
    return { success: false, error: "Failed to create offer" };
  }
}
