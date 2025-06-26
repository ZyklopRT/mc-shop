"use server";

import { z } from "zod";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import {
  createRequestSchema,
  type CreateRequestData,
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
