"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import type { RequestActionResult } from "~/lib/types/request";
import type { RequestWithDetails } from "~/lib/types/request";

export async function getUserAcceptedOffers(): Promise<
  RequestActionResult<{ requests: RequestWithDetails[] }>
> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view your accepted offers",
      };
    }

    // Fetch requests where the current user has accepted offers
    const requests = await db.request.findMany({
      where: {
        offers: {
          some: {
            offererId: session.user.id,
            status: "ACCEPTED",
          },
        },
      },
      include: {
        requester: {
          select: {
            id: true,
            mcUsername: true,
          },
        },
        item: true,
        offers: {
          where: {
            offererId: session.user.id,
            status: "ACCEPTED",
          },
          include: {
            offerer: {
              select: {
                id: true,
                mcUsername: true,
              },
            },
          },
        },
        negotiation: {
          include: {
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    mcUsername: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        _count: {
          select: {
            offers: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return {
      success: true,
      data: { requests },
    };
  } catch (error) {
    console.error("Error fetching user accepted offers:", error);
    return {
      success: false,
      error: "Failed to load your accepted offers",
    };
  }
}
