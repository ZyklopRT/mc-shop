"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import {
  updateRequestSchema,
  type UpdateRequestData,
} from "~/lib/validations/request";
import type { RequestWithDetails } from "~/lib/types/request";

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
