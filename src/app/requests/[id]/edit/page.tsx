"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { SimpleItemSelector } from "~/components/shops/simple-item-selector";
import { CurrencySelector } from "~/components/shops/currency-selector";
import { CURRENCY_TYPES } from "~/lib/validations/shop";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  MessageCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { MinecraftItem } from "@prisma/client";
import {
  getRequestDetails,
  updateRequest,
  deleteRequest,
} from "~/server/actions/request-actions";

type RequestType = "ITEM" | "GENERAL";
type Currency = (typeof CURRENCY_TYPES)[keyof typeof CURRENCY_TYPES];

interface RequestFormData {
  title: string;
  description: string;
  requestType: RequestType;
  selectedItem?: MinecraftItem | null;
  itemQuantity?: number;
  suggestedPrice?: number;
  currency: Currency;
}

interface EditRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditRequestPage({ params }: EditRequestPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<RequestFormData>({
    title: "",
    description: "",
    requestType: "GENERAL",
    currency: CURRENCY_TYPES.EMERALDS,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadRequestData();
  }, [id]);

  const loadRequestData = async () => {
    try {
      const result = await getRequestDetails({ requestId: id });

      if (!result.success) {
        if (result.error === "Request not found") {
          notFound();
        }
        throw new Error(result.error);
      }

      const { request } = result.data as any;

      setFormData({
        title: request.title,
        description: request.description,
        requestType: request.requestType,
        selectedItem: request.item,
        itemQuantity: request.itemQuantity,
        suggestedPrice: request.suggestedPrice,
        currency: request.currency as Currency,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading request:", error);
      toast.error("Failed to load request data");
      router.push("/requests");
    }
  };

  const validateForm = (): boolean => {
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
  };

  const handleInputChange = (field: keyof RequestFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        requestId: id,
        title: formData.title,
        description: formData.description,
        suggestedPrice: formData.suggestedPrice,
      };

      const result = await updateRequest(updateData);

      if (result.success) {
        toast.success("Request updated successfully!");
        router.push(`/requests/${id}`);
      } else {
        toast.error("Error updating request", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error updating request", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRequest(id);

      if (result.success) {
        toast.success("Request deleted successfully!");
        router.push("/requests");
      } else {
        toast.error("Error deleting request", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error deleting request", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-6">
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link href={`/requests/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Request
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/requests/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Request
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Request</h1>
        <p className="text-gray-600">
          Update your request details or delete the request
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Modify your request information. Note: Request type and item cannot
            be changed after creation.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type - Read Only */}
            <div className="space-y-2">
              <Label>Request Type</Label>
              <div className="bg-muted flex items-center gap-4 rounded-lg p-3">
                {formData.requestType === "ITEM" ? (
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Item Request
                  </div>
                ) : (
                  <div className="flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Service Request
                  </div>
                )}
                <span className="text-muted-foreground text-sm">
                  (Cannot be changed)
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={
                  formData.requestType === "ITEM"
                    ? "e.g., Need 64 Iron Ore"
                    : "e.g., Help building a castle"
                }
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder={
                  formData.requestType === "ITEM"
                    ? "Describe the specific item you need, its condition, enchantments, etc."
                    : "Describe the service you need, requirements, timeline, etc."
                }
                className="min-h-[100px]"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Item-specific fields - Read Only */}
            {formData.requestType === "ITEM" && formData.selectedItem && (
              <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">
                  Item Details (Cannot be changed)
                </h3>
                <div className="space-y-2">
                  <Label>Selected Item</Label>
                  <div className="bg-background rounded border p-3">
                    <span className="font-medium">
                      {formData.selectedItem.nameEn}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      ({formData.selectedItem.id})
                    </span>
                  </div>
                </div>
                {formData.itemQuantity && (
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <div className="bg-background rounded border p-3">
                      <span className="font-medium">
                        {formData.itemQuantity}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price and Currency */}
            <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
              <h3 className="font-medium">Payment Details (Optional)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suggestedPrice">Suggested Price</Label>
                  <Input
                    id="suggestedPrice"
                    type="number"
                    placeholder="10"
                    value={formData.suggestedPrice ?? ""}
                    onChange={(e) =>
                      handleInputChange(
                        "suggestedPrice",
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                  {errors.suggestedPrice && (
                    <p className="text-sm text-red-500">
                      {errors.suggestedPrice}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <div className="bg-background rounded border p-3">
                    <span className="font-medium">
                      {formData.currency === CURRENCY_TYPES.EMERALDS
                        ? "Emeralds"
                        : "Emerald Blocks"}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      (Cannot be changed)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                You can negotiate the final price with interested players
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Request"
                )}
              </Button>
            </div>

            {/* Delete Section */}
            <div className="border-t pt-6">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 font-medium text-red-900">Danger Zone</h3>
                <p className="mb-4 text-sm text-red-700">
                  Deleting this request will permanently remove it along with
                  all offers and negotiations. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Request
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your request and remove all associated offers and
                        negotiations from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Request"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
