"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

import { SimpleItemSelector } from "~/components/shops/simple-item-selector";
import { CurrencySelector } from "~/components/shops/currency-selector";
import { CURRENCY_TYPES } from "~/lib/validations/shop";
import { toast } from "sonner";
import { ArrowLeft, Package, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { MinecraftItem } from "@prisma/client";
import { createRequest } from "~/server/actions/request-actions";

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

export default function NewRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RequestFormData>({
    title: "",
    description: "",
    requestType: "GENERAL",
    currency: CURRENCY_TYPES.EMERALDS,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      // Convert formData to the format expected by the API
      const requestData = {
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
        router.push("/requests");
      } else {
        toast.error("Error creating request", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error creating request", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Request</h1>
          <p className="text-muted-foreground mt-1">
            Request items or services from other players
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Fill out the form below to create your request. Be specific about
            what you need.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div className="space-y-2">
              <Label>Request Type</Label>
              <RadioGroup
                value={formData.requestType}
                onValueChange={(value: RequestType) =>
                  handleInputChange("requestType", value)
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ITEM" id="item" />
                  <Label
                    htmlFor="item"
                    className="flex cursor-pointer items-center"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Item Request
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GENERAL" id="general" />
                  <Label
                    htmlFor="general"
                    className="flex cursor-pointer items-center"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Service Request
                  </Label>
                </div>
              </RadioGroup>
              {errors.requestType && (
                <p className="text-sm text-red-500">{errors.requestType}</p>
              )}
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

            {/* Item-specific fields */}
            {formData.requestType === "ITEM" && (
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Item Details</h3>

                <div className="space-y-2">
                  <SimpleItemSelector
                    selectedItem={formData.selectedItem ?? null}
                    onItemSelect={(item) =>
                      handleInputChange("selectedItem", item)
                    }
                    placeholder="Search for a Minecraft item..."
                  />
                  {errors.selectedItem && (
                    <p className="text-sm text-red-500">
                      {errors.selectedItem}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemQuantity">Quantity</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    placeholder="64"
                    value={formData.itemQuantity ?? ""}
                    onChange={(e) =>
                      handleInputChange(
                        "itemQuantity",
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                  />
                  {errors.itemQuantity && (
                    <p className="text-sm text-red-500">
                      {errors.itemQuantity}
                    </p>
                  )}
                </div>
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
                  <CurrencySelector
                    value={formData.currency}
                    onValueChange={(value: string) =>
                      handleInputChange("currency", value as Currency)
                    }
                    placeholder="Select currency"
                  />
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
                    Creating...
                  </>
                ) : (
                  "Create Request"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
