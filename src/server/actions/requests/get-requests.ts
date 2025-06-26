"use server";

import { z } from "zod";
import { db } from "~/server/db";
import {
  getRequestsSchema,
  getRequestDetailsSchema,
  searchRequestsSchema,
  type GetRequestsData,
  type GetRequestDetailsData,
  type SearchRequestsData,
} from "~/lib/validations/request";
import type {
  RequestListResponse,
  RequestDetailsResponse,
} from "~/lib/types/request";

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
 * Get requests with filtering and pagination
 */
export async function getRequests(
  data: GetRequestsData,
): Promise<RequestActionResult<RequestListResponse>> {
  try {
    const validatedData = getRequestsSchema.parse(data);
    const { limit, offset, orderBy, orderDirection, ...filters } =
      validatedData;

    // Build where clause
    const where: Record<string, unknown> = {
      ...(filters.status && { status: filters.status }),
      ...(filters.requestType && { requestType: filters.requestType }),
      ...(filters.requesterId && { requesterId: filters.requesterId }),
      ...(filters.itemId && { itemId: filters.itemId }),
    };

    const orderClause = { [orderBy]: orderDirection };

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          requester: { select: { mcUsername: true, id: true } },
          item: true,
          _count: { select: { offers: true } },
        },
        orderBy: orderClause,
        take: limit,
        skip: offset,
      }),
      db.request.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        requests,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Get requests error:", error);
    return { success: false, error: "Failed to get requests" };
  }
}

/**
 * Get request details with full information
 */
export async function getRequestDetails(
  data: GetRequestDetailsData,
): Promise<RequestActionResult<RequestDetailsResponse>> {
  try {
    const { requestId } = getRequestDetailsSchema.parse(data);

    const request = await db.request.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { mcUsername: true, id: true } },
        item: true,
        offers: {
          include: {
            offerer: { select: { mcUsername: true, id: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        negotiation: {
          include: {
            messages: {
              include: {
                sender: { select: { mcUsername: true, id: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    return { success: true, data: { request } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Get request details error:", error);
    return { success: false, error: "Failed to get request details" };
  }
}

/**
 * Search requests by title and description
 */
export async function searchRequests(
  data: SearchRequestsData,
): Promise<RequestActionResult<RequestListResponse>> {
  try {
    const { query, requestType, limit, offset } =
      searchRequestsSchema.parse(data);

    const where: Record<string, unknown> = {
      AND: [
        { status: "OPEN" }, // Only search open requests
        {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        ...(requestType ? [{ requestType }] : []),
      ],
    };

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          requester: { select: { mcUsername: true, id: true } },
          item: true,
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.request.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        requests,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    console.error("Search requests error:", error);
    return { success: false, error: "Failed to search requests" };
  }
}
