"use server";

import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import type {
  RequestActionResult,
  RequestOfferWithDetails,
} from "~/lib/types/request";

const getOffersSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
});

export async function getOffers(
  data: z.infer<typeof getOffersSchema>,
): Promise<RequestActionResult<{ offers: RequestOfferWithDetails[] }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to view offers" };
    }

    // Validate input
    const validatedFields = getOffersSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, error: "Invalid request ID" };
    }

    const { requestId } = validatedFields.data;

    // Check if request exists and user has permission to view offers
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Only the request owner can see all offers, others can only see their own
    const isRequestOwner = request.requesterId === session.user.id;

    const whereClause = isRequestOwner
      ? { requestId }
      : { requestId, offererId: session.user.id };

    // Fetch offers
    const offers = await db.requestOffer.findMany({
      where: whereClause,
      include: {
        offerer: {
          select: {
            id: true,
            mcUsername: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            requesterId: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: { offers } };
  } catch (error) {
    console.error("Error fetching offers:", error);
    return { success: false, error: "Failed to fetch offers" };
  }
}
