"use server";

import { db } from "~/server/db";
import { auth } from "~/server/auth";

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
 * Delete a request and all associated data
 */
export async function deleteRequest(
  requestId: string,
): Promise<RequestActionResult<null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify request exists and user owns it
    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return { success: false, error: "Request not found" };
    }

    if (existingRequest.requesterId !== session.user.id) {
      return { success: false, error: "Not authorized to delete this request" };
    }

    // Delete the request and all associated data using cascading deletes
    await db.request.delete({
      where: { id: requestId },
    });

    return { success: true, data: null };
  } catch (error) {
    console.error("Delete request error:", error);
    return { success: false, error: "Failed to delete request" };
  }
}
