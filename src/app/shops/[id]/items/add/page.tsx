"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { Separator } from "~/components/ui/separator";
import { SimpleItemSelector } from "~/components/shops/simple-item-selector";
import { CurrencySelector } from "~/components/shops/currency-selector";
import { CURRENCY_TYPES } from "~/lib/validations/shop";
import { z } from "zod";
import { addItemToShop } from "~/server/actions/shop-items";

import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, DollarSign, Package } from "lucide-react";
import type { MinecraftItem } from "@prisma/client";
import { ItemPreviewLarge } from "~/components/items/item-preview";

// Form schema for this page with required amount
const addItemFormSchema = z.object({
  price: z.number().positive("Price must be positive"),
  amount: z.number().int().min(1, "Amount must be at least 1"),
  currency: z.enum([CURRENCY_TYPES.EMERALDS, CURRENCY_TYPES.EMERALD_BLOCKS]),
});

type AddItemFormData = z.infer<typeof addItemFormSchema>;

export default function AddItemToShopPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const shopId = params.id as string;

  const [selectedItem, setSelectedItem] = useState<MinecraftItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddItemFormData>({
    resolver: zodResolver(addItemFormSchema),
    defaultValues: {
      price: 1,
      amount: 64,
      currency: CURRENCY_TYPES.EMERALDS,
    },
  });

  const onSubmit = async (data: AddItemFormData) => {
    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await addItemToShop({
        shopId,
        itemId: selectedItem.id,
        price: data.price,
        amount: data.amount,
        currency: data.currency,
      });

      if (result.success) {
        toast.success("Item added to shop successfully!");
        router.push(`/shops/${shopId}`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to add item to shop");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/shops/${shopId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </Button>

        <div className="mb-2 flex items-center gap-3">
          <Plus className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-bold">Add Item to Shop</h1>
        </div>
        <p className="text-gray-600">
          Add a new item to your shop with pricing and currency options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>
            Select a Minecraft item and set its price and currency type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Item Selection */}
              <div className="space-y-4">
                <SimpleItemSelector
                  selectedItem={selectedItem}
                  onItemSelect={setSelectedItem}
                  placeholder="Search for a Minecraft item..."
                />
              </div>

              <Separator />

              {/* Quantity, Price and Currency */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Package className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            className="pl-10"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 1 : value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        How many items are sold as a bundle (e.g., 32 iron ore)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Price per item</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <CurrencySelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select currency"
                        />
                      </FormControl>
                      <FormDescription>
                        Choose the currency for pricing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              {selectedItem && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Preview</h3>
                    <ItemPreviewLarge
                      item={selectedItem}
                      price={form.watch("price")}
                      amount={form.watch("amount")}
                      currency={form.watch("currency")}
                      isAvailable={true}
                      className="bg-muted/50"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/shops/${shopId}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedItem || isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
