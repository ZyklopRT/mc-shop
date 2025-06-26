import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MinecraftItem } from "@prisma/client";
import { CURRENCY_TYPES } from "~/lib/validations/shop";
import { createRequest, updateRequest } from "~/server/actions/request-actions";
import type {
  CreateRequestData,
  UpdateRequestData,
} from "~/lib/validations/request";

export type RequestType = "ITEM" | "GENERAL";
export type Currency = (typeof CURRENCY_TYPES)[keyof typeof CURRENCY_TYPES];

export interface RequestFormData {
  title: string;
  description: string;
  requestType: RequestType;
  selectedItem?: MinecraftItem | null;
  itemQuantity?: number;
  suggestedPrice?: number;
  currency: Currency;
}

export interface UseRequestFormOptions {
  mode: "create" | "edit";
  requestId?: string;
  initialData?: Partial<RequestFormData>;
  onSuccess?: (requestId: string) => void;
}

export function useRequestForm(options: UseRequestFormOptions) {
  const { mode, requestId, initialData, onSuccess } = options;
  const router = useRouter();

  const [formData, setFormData] = useState<RequestFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    requestType: initialData?.requestType ?? "GENERAL",
    selectedItem: initialData?.selectedItem ?? null,
    itemQuantity: initialData?.itemQuantity,
    suggestedPrice: initialData?.suggestedPrice,
    currency: initialData?.currency ?? CURRENCY_TYPES.EMERALDS,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be at most 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must be at most 1000 characters";
    }

    if (formData.requestType === "ITEM") {
      if (!formData.selectedItem) {
        newErrors.selectedItem = "Please select an item for item requests";
      }
      if (!formData.itemQuantity || formData.itemQuantity < 1) {
        newErrors.itemQuantity = "Quantity is required for item requests";
      }
    }

    if (formData.suggestedPrice !== undefined && formData.suggestedPrice < 0) {
      newErrors.suggestedPrice = "Price must be at least 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (field: keyof RequestFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        if (mode === "create") {
          const requestData: CreateRequestData = {
            title: formData.title,
            description: formData.description,
            requestType: formData.requestType,
            itemId: formData.selectedItem?.id,
            itemQuantity: formData.itemQuantity,
            suggestedPrice: formData.suggestedPrice,
            currency: formData.currency,
          };

          const result = await createRequest(requestData);

          if (result.success) {
            toast.success("Request created successfully!", {
              description: "Your request has been posted to the request board.",
            });
            if (onSuccess) {
              onSuccess(result.data.id);
            } else {
              router.push("/requests");
            }
          } else {
            toast.error("Error creating request", {
              description: result.error,
            });
          }
        } else if (mode === "edit" && requestId) {
          const updateData: UpdateRequestData = {
            requestId,
            title: formData.title,
            description: formData.description,
            suggestedPrice: formData.suggestedPrice,
          };

          const result = await updateRequest(updateData);

          if (result.success) {
            toast.success("Request updated successfully!");
            if (onSuccess) {
              onSuccess(requestId);
            } else {
              router.push(`/requests/${requestId}`);
            }
          } else {
            toast.error("Error updating request", {
              description: result.error,
            });
          }
        }
      } catch {
        toast.error(
          `Error ${mode === "create" ? "creating" : "updating"} request`,
          {
            description: "An unexpected error occurred. Please try again.",
          },
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, mode, requestId, onSuccess, router, validateForm],
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      requestType: "GENERAL",
      selectedItem: null,
      currency: CURRENCY_TYPES.EMERALDS,
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    resetForm,
    validateForm,
  };
}
