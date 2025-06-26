"use client";

import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { SimpleItemSelector } from "~/components/shops/simple-item-selector";
import { CurrencySelector } from "~/components/shops/currency-selector";
import { Package, MessageCircle, Loader2 } from "lucide-react";
import {
  useRequestForm,
  type UseRequestFormOptions,
} from "~/lib/hooks/use-request-form";

interface RequestFormProps extends UseRequestFormOptions {
  className?: string;
}

export function RequestForm({ className, ...options }: RequestFormProps) {
  const { formData, errors, isSubmitting, handleInputChange, handleSubmit } =
    useRequestForm(options);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className ?? ""}`}>
      {/* Request Type - Only show for create mode */}
      {options.mode === "create" && (
        <div className="space-y-2">
          <Label>Request Type</Label>
          <RadioGroup
            value={formData.requestType}
            onValueChange={(value: "ITEM" | "GENERAL") =>
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
      )}

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
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
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
          onChange={(e) => handleInputChange("description", e.target.value)}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Item-specific fields - Only show for item requests and create mode */}
      {formData.requestType === "ITEM" && options.mode === "create" && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Item Details</h3>

          <div className="space-y-2">
            <SimpleItemSelector
              selectedItem={formData.selectedItem ?? null}
              onItemSelect={(item) => handleInputChange("selectedItem", item)}
              placeholder="Search for a Minecraft item..."
            />
            {errors.selectedItem && (
              <p className="text-sm text-red-500">{errors.selectedItem}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemQuantity">Quantity</Label>
            <Input
              id="itemQuantity"
              type="number"
              min="1"
              max="999999"
              placeholder="How many items do you need?"
              value={formData.itemQuantity ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "itemQuantity",
                  parseInt(e.target.value) || undefined,
                )
              }
            />
            {errors.itemQuantity && (
              <p className="text-sm text-red-500">{errors.itemQuantity}</p>
            )}
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium">Reward/Payment (Optional)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="suggestedPrice">Price</Label>
            <Input
              id="suggestedPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.suggestedPrice ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "suggestedPrice",
                  parseFloat(e.target.value) || undefined,
                )
              }
            />
            {errors.suggestedPrice && (
              <p className="text-sm text-red-500">{errors.suggestedPrice}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <CurrencySelector
              value={formData.currency}
              onValueChange={(currency) =>
                handleInputChange("currency", currency)
              }
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {options.mode === "create" ? "Create Request" : "Update Request"}
      </Button>
    </form>
  );
}
