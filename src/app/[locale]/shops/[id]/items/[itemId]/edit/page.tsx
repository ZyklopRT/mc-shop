"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, Trash2, Save, Pencil } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import { ItemPreview } from "~/components/items/item-preview";
import {
  updateShopItemSchema,
  CURRENCY_TYPES,
  currencyDisplayNames,
} from "~/lib/validations/shop";
import {
  getShopItem,
  updateShopItem,
  removeItemFromShop,
} from "~/server/actions/shop-items";
import { toast } from "~/lib/utils/toast";
import type { ShopItemWithItem } from "~/lib/types/shop";
import Link from "next/link";

const editShopItemFormSchema = updateShopItemSchema.omit({ shopItemId: true });
type EditShopItemForm = z.infer<typeof editShopItemFormSchema>;

export default function EditShopItemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;
  const shopItemId = params.itemId as string;

  const [shopItem, setShopItem] = useState<ShopItemWithItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<EditShopItemForm>({
    resolver: zodResolver(editShopItemFormSchema),
  });

  const loadShopItem = useCallback(async () => {
    try {
      setError(null);
      const result = await getShopItem(shopItemId);
      if (result.success) {
        setShopItem(result.data);

        reset({
          price: result.data.price,
          amount: result.data.amount,
          currency: result.data.currency as "emeralds" | "emerald_blocks",
          isAvailable: result.data.isAvailable,
        });
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch {
      setError("Failed to load shop item details");
      toast.error("Failed to load shop item details");
    } finally {
      setIsLoading(false);
    }
  }, [shopItemId, reset]);

  useEffect(() => {
    if (shopItemId) {
      void loadShopItem();
    }
  }, [shopItemId, loadShopItem]);
  useEffect(() => {
    if (shopItem?.shop && "ownerId" in shopItem.shop && session?.user?.id) {
      const isOwner = session.user.id === shopItem.shop.ownerId;
      if (!isOwner) {
        toast.error(
          "You don't have permission to edit this shop item. Redirecting...",
        );
        router.push(`/shops/${shopId}`);
      }
    }
  }, [shopItem, session?.user?.id, shopId, router]);

  const onSubmit = async (data: EditShopItemForm) => {
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateShopItem({
        shopItemId,
        ...data,
      });

      if (result.success) {
        toast.success("Shop item updated successfully!");
        router.push(`/shops/${shopId}`);
      } else {
        if (
          result.error.includes("permission") ||
          result.error.includes("access denied")
        ) {
          toast.error("Permission denied. Redirecting to shop...");
          router.push(`/shops/${shopId}`);
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error("Failed to update shop item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await removeItemFromShop({ shopItemId });

      if (result.success) {
        toast.success("Item removed from shop successfully!");
        router.push(`/shops/${shopId}`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to remove item from shop");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <PageWrapper className="max-w-4xl">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  if (!session?.user) {
    router.push("/auth/login");
    return null;
  }

  if (isLoading) {
    return (
      <PageWrapper className="max-w-4xl">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Loading shop item...</div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !shopItem) {
    return (
      <PageWrapper className="max-w-4xl">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error ?? "Shop item not found"}</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const isOwner =
    shopItem?.shop &&
    "ownerId" in shopItem.shop &&
    session?.user?.id === shopItem.shop.ownerId;

  if (!isOwner && shopItem) {
    return (
      <PageWrapper className="max-w-2xl">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Checking permissions...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/shops/${shopId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {shopItem.shop?.name}
          </Link>
        </Button>

        <div className="mb-2 flex items-center gap-3">
          <Pencil className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-bold">Edit Shop Item</h1>
        </div>
        <p className="text-muted-foreground">
          Update the pricing and availability for this item.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>
            Update the price, amount, currency, and availability for this item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold">Current Item</h3>
            <ItemPreview
              item={shopItem.item}
              price={watch("price") ?? shopItem.price}
              amount={watch("amount") ?? shopItem.amount}
              currency={watch("currency") ?? shopItem.currency}
              isAvailable={watch("isAvailable") ?? shopItem.isAvailable}
              imageSize="lg"
              showRotatingImages={true}
              className="bg-muted/50"
            />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder="Enter price"
              />
              {errors.price && (
                <p className="text-destructive text-sm">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (items per purchase) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                {...register("amount", { valueAsNumber: true })}
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="text-destructive text-sm">
                  {errors.amount.message}
                </p>
              )}
              <p className="text-muted-foreground text-sm">
                How many items are sold as a bundle (e.g., 32 for a stack of
                iron ore)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) =>
                  setValue("currency", value as "emeralds" | "emerald_blocks", {
                    shouldDirty: true,
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCY_TYPES).map(([_key, value]) => (
                    <SelectItem key={value} value={value}>
                      {currencyDisplayNames[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-destructive text-sm">
                  {errors.currency.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={watch("isAvailable") ?? true}
                onCheckedChange={(checked: boolean) =>
                  setValue("isAvailable", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
              />
              <Label htmlFor="isAvailable">
                Item is available for purchase
              </Label>
            </div>

            <div className="flex items-center justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove from Shop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Item from Shop</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove &quot;
                      {shopItem.item.nameEn}&quot; from your shop? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove Item
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
