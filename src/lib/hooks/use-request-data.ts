import { useState, useCallback, useEffect } from "react";
import { useRouter } from "~/lib/i18n/routing";
import { toast } from "sonner";
import {
  getRequestDetails,
  deleteRequest,
  getRequests,
} from "~/server/actions/requests";
import type {
  RequestWithFullDetails,
  RequestWithDetails,
} from "~/lib/types/request";

export interface UseRequestDataOptions {
  requestId?: string;
  autoLoad?: boolean;
}

export function useRequestData(options: UseRequestDataOptions = {}) {
  const { requestId, autoLoad = false } = options;
  const router = useRouter();

  const [request, setRequest] = useState<RequestWithFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getRequestDetails({ requestId: id });

        if (!result.success) {
          setError(result.error);
          if (result.error === "Request not found") {
            router.push("/404");
          }
          return null;
        }

        const requestData = result.data.request;
        setRequest(requestData);
        return requestData;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load request";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const deleteRequestById = useCallback(
    async (id: string) => {
      try {
        const result = await deleteRequest(id);

        if (result.success) {
          toast.success("Request deleted successfully!");
          router.push("/requests");
          return true;
        } else {
          toast.error("Error deleting request", {
            description: result.error,
          });
          return false;
        }
      } catch {
        toast.error("Error deleting request", {
          description: "An unexpected error occurred. Please try again.",
        });
        return false;
      }
    },
    [router],
  );

  const refreshRequest = useCallback(async () => {
    if (requestId) {
      return await loadRequest(requestId);
    }
    return null;
  }, [requestId, loadRequest]);

  useEffect(() => {
    if (autoLoad && requestId) {
      void loadRequest(requestId);
    }
  }, [autoLoad, requestId, loadRequest]);

  return {
    request,
    isLoading,
    error,
    loadRequest,
    deleteRequestById,
    refreshRequest,
  };
}

export interface UseRequestListOptions {
  initialFilters?: {
    status?: string;
    requestType?: string;
    limit?: number;
  };
  autoLoad?: boolean;
}

export function useRequestList(options: UseRequestListOptions = {}) {
  const { initialFilters, autoLoad = false } = options;

  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadRequests = useCallback(
    async (filters = initialFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getRequests({
          limit: 20,
          offset: 0,
          orderBy: "createdAt" as const,
          orderDirection: "desc" as const,
          status: (filters?.status ?? "OPEN") as
            | "OPEN"
            | "IN_NEGOTIATION"
            | "ACCEPTED"
            | "COMPLETED"
            | "CANCELLED",
          requestType: filters?.requestType as "ITEM" | "GENERAL" | undefined,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }

        const data = result.data;
        setRequests(data.requests);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load requests";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [initialFilters],
  );

  const refreshRequests = useCallback(async () => {
    await loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (autoLoad) {
      void loadRequests();
    }
  }, [autoLoad, loadRequests]);

  return {
    requests,
    isLoading,
    error,
    hasMore,
    total,
    loadRequests,
    refreshRequests,
  };
}
