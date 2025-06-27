import { useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { RequestActionResult } from "~/lib/types/request";

// Server action types
export interface RequestActions {
  createOffer: (
    formData: FormData,
  ) => Promise<RequestActionResult<{ offerId: string }>>;
  updateOffer: (
    formData: FormData,
  ) => Promise<RequestActionResult<{ offerId: string; status: string }>>;
  sendNegotiationMessage: (
    formData: FormData,
  ) => Promise<RequestActionResult<{ messageId: string }>>;
  completeRequest: (
    formData: FormData,
  ) => Promise<RequestActionResult<{ requestId: string }>>;
  deleteRequest: (requestId: string) => Promise<RequestActionResult<null>>;
}

interface UseRequestActionsOptions {
  requestId: string;
  onSuccess?: (action: string, data?: unknown) => void;
  onError?: (action: string, error: string) => void;
}

/**
 * Custom hook to handle all request-related actions with consistent error handling and loading states
 */
export function useRequestActions(
  actions: RequestActions,
  options: UseRequestActionsOptions,
) {
  const { requestId, onSuccess, onError } = options;
  const router = useRouter();

  const handleCreateOffer = useCallback(
    async (formData: FormData) => {
      try {
        const result = await actions.createOffer(formData);

        if (result.success) {
          toast.success("Offer submitted successfully!", {
            description: "The request owner will be notified of your offer.",
          });
          onSuccess?.("createOffer", result.data);
          return result;
        } else {
          const errorMessage = result.error || "Failed to submit offer";
          toast.error("Error submitting offer", { description: errorMessage });
          onError?.("createOffer", errorMessage);
          return result;
        }
      } catch {
        const errorMessage =
          "An unexpected error occurred while submitting the offer";
        toast.error("Error submitting offer", { description: errorMessage });
        onError?.("createOffer", errorMessage);
        return { success: false, error: errorMessage } as const;
      }
    },
    [actions, onSuccess, onError],
  );

  const handleUpdateOffer = useCallback(
    async (formData: FormData) => {
      try {
        const result = await actions.updateOffer(formData);

        if (result.success) {
          const status = formData.get("status") as string;
          const actionText =
            status === "ACCEPTED"
              ? "accepted"
              : status === "REJECTED"
                ? "rejected"
                : "withdrawn";
          toast.success(`Offer has been ${actionText} successfully.`);
          onSuccess?.("updateOffer", result.data);
          return result;
        } else {
          const errorMessage = result.error || "Failed to update offer";
          toast.error("Error updating offer", { description: errorMessage });
          onError?.("updateOffer", errorMessage);
          return result;
        }
      } catch {
        const errorMessage =
          "An unexpected error occurred while updating the offer";
        toast.error("Error updating offer", { description: errorMessage });
        onError?.("updateOffer", errorMessage);
        return { success: false, error: errorMessage } as const;
      }
    },
    [actions, onSuccess, onError],
  );

  const handleSendNegotiationMessage = useCallback(
    async (formData: FormData) => {
      try {
        const result = await actions.sendNegotiationMessage(formData);

        if (result.success) {
          const messageType = formData.get("messageType") as string;
          if (messageType === "ACCEPT") {
            toast.success("Terms accepted!", {
              description: "Waiting for the other party to accept as well.",
            });
          } else if (messageType === "REJECT") {
            toast.success("Negotiation ended", {
              description: "The negotiation has been rejected.",
            });
          } else if (messageType === "COUNTER_OFFER") {
            toast.success("Counter-offer sent!", {
              description:
                "The other party will be notified of your counter-offer.",
            });
          }
          onSuccess?.("sendMessage", result.data);
          return result;
        } else {
          const errorMessage = result.error || "Failed to send message";
          toast.error("Error sending message", { description: errorMessage });
          onError?.("sendMessage", errorMessage);
          return result;
        }
      } catch {
        const errorMessage =
          "An unexpected error occurred while sending the message";
        toast.error("Error sending message", { description: errorMessage });
        onError?.("sendMessage", errorMessage);
        return { success: false, error: errorMessage } as const;
      }
    },
    [actions, onSuccess, onError],
  );

  const handleCompleteRequest = useCallback(
    async (formData: FormData) => {
      try {
        const result = await actions.completeRequest(formData);

        if (result.success) {
          toast.success("Request completed successfully!", {
            description: "The transaction has been marked as completed.",
          });
          onSuccess?.("completeRequest", result.data);
          router.push("/requests");
          return result;
        } else {
          const errorMessage = result.error || "Failed to complete request";
          toast.error("Error completing request", {
            description: errorMessage,
          });
          onError?.("completeRequest", errorMessage);
          return result;
        }
      } catch {
        const errorMessage =
          "An unexpected error occurred while completing the request";
        toast.error("Error completing request", { description: errorMessage });
        onError?.("completeRequest", errorMessage);
        return { success: false, error: errorMessage } as const;
      }
    },
    [actions, onSuccess, onError, router],
  );

  const handleDeleteRequest = useCallback(async () => {
    try {
      const result = await actions.deleteRequest(requestId);

      if (result.success) {
        toast.success("Request deleted successfully!");
        onSuccess?.("deleteRequest", { requestId });
        router.push("/requests");
        return result;
      } else {
        const errorMessage = result.error || "Failed to delete request";
        toast.error("Error deleting request", { description: errorMessage });
        onError?.("deleteRequest", errorMessage);
        return result;
      }
    } catch {
      const errorMessage =
        "An unexpected error occurred while deleting the request";
      toast.error("Error deleting request", { description: errorMessage });
      onError?.("deleteRequest", errorMessage);
      return { success: false, error: errorMessage } as const;
    }
  }, [actions, requestId, onSuccess, onError, router]);

  return {
    createOffer: handleCreateOffer,
    updateOffer: handleUpdateOffer,
    sendNegotiationMessage: handleSendNegotiationMessage,
    completeRequest: handleCompleteRequest,
    deleteRequest: handleDeleteRequest,
  };
}
