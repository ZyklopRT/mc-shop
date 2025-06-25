"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
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
import { getShopDetails, updateShop, deleteShop } from "~/server/actions/shops";
import { updateShopSchema, type UpdateShopData } from "~/lib/validations/shop";
import type { ShopWithItems } from "~/lib/types/shop";
import Link from "next/link";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { toast } from "~/lib/utils/toast";

type EditShopForm = Omit<UpdateShopData, "shopId">;

export default function EditShopPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<ShopWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<EditShopForm>({
    resolver: zodResolver(updateShopSchema.omit({ shopId: true })),
  });

  const loadShop = useCallback(async () => {
    try {
      setError(null);
      const result = await getShopDetails({ shopId, includeItems: true });
      if (result.success) {
        const shopData = result.data.shop;
        setShop(shopData);

        // Populate form with current shop data
        reset({
          name: shopData.name,
          description: shopData.description ?? "",
          locationX: shopData.locationX ?? undefined,
          locationY: shopData.locationY ?? undefined,
          locationZ: shopData.locationZ ?? undefined,
          isActive: shopData.isActive,
        });
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load shop details");
    } finally {
      setIsLoading(false);
    }
  }, [shopId, reset]);

  useEffect(() => {
    if (shopId) {
      void loadShop();
    }
  }, [shopId, loadShop]);

  const onSubmit = async (data: EditShopForm) => {
    if (!shop) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateShop({
        shopId: shop.id,
        ...data,
      });

      if (result.success) {
        // Update the shop with the returned data (preserving existing shopItems)
        const updatedShop = {
          ...shop,
          ...result.data,
        };
        setShop(updatedShop);

        reset({
          name: result.data.name,
          description: result.data.description ?? "",
          locationX: result.data.locationX ?? undefined,
          locationY: result.data.locationY ?? undefined,
          locationZ: result.data.locationZ ?? undefined,
          isActive: result.data.isActive,
        });

        // Show success message
        toast.success(
          "Shop Updated",
          "Your shop has been updated successfully",
        );
        router.push(`/shops/${shop.id}`);
      } else {
        setError(result.error);
        toast.error("Update Failed", result.error);
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("Update Failed", "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!shop) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteShop({ shopId: shop.id });

      if (result.success) {
        toast.success(
          "Shop Deleted",
          "Your shop has been deleted successfully",
        );
        router.push("/shops");
      } else {
        setError(result.error);
        toast.error("Delete Failed", result.error);
      }
    } catch {
      setError("Failed to delete shop");
      toast.error("Delete Failed", "Failed to delete shop");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p>Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Authentication Required</h1>
          <p className="mb-4 text-gray-600">Please login to edit shops.</p>
          <Button asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={loadShop}>Try Again</Button>
            <Button asChild variant="outline">
              <Link href="/shops">Back to Shops</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Shop Not Found</h1>
          <p className="mb-4 text-gray-600">
            The shop you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/shops">Back to Shops</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Check if user is the owner
  const isOwner = session?.user?.mcUsername === shop.owner.mcUsername;

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="mb-4 text-gray-600">
            You don&apos;t have permission to edit this shop.
          </p>
          <Button asChild>
            <Link href={`/shops/${shop.id}`}>View Shop</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link href={`/shops/${shop.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Edit Shop</h1>
              <p className="text-gray-600">
                Update your shop&apos;s information
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${shop.isActive ? "bg-green-500" : "bg-gray-400"}`}
              />
              <span className="text-sm text-gray-600">
                {shop.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter shop name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your shop (optional)"
                className={errors.description ? "border-red-500" : ""}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4">
              <Label>Location (Optional)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationX" className="text-sm text-gray-600">
                    X Coordinate
                  </Label>
                  <Input
                    id="locationX"
                    type="number"
                    {...register("locationX", { valueAsNumber: true })}
                    placeholder="X"
                    className={errors.locationX ? "border-red-500" : ""}
                  />
                  {errors.locationX && (
                    <p className="text-sm text-red-600">
                      {errors.locationX.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationY" className="text-sm text-gray-600">
                    Y Coordinate
                  </Label>
                  <Input
                    id="locationY"
                    type="number"
                    {...register("locationY", { valueAsNumber: true })}
                    placeholder="Y"
                    className={errors.locationY ? "border-red-500" : ""}
                  />
                  {errors.locationY && (
                    <p className="text-sm text-red-600">
                      {errors.locationY.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationZ" className="text-sm text-gray-600">
                    Z Coordinate
                  </Label>
                  <Input
                    id="locationZ"
                    type="number"
                    {...register("locationZ", { valueAsNumber: true })}
                    placeholder="Z"
                    className={errors.locationZ ? "border-red-500" : ""}
                  />
                  {errors.locationZ && (
                    <p className="text-sm text-red-600">
                      {errors.locationZ.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isActive" className="text-sm font-medium">
                Shop is active and visible to other players
              </Label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={isSubmitting || !isDirty}
                >
                  Reset
                </Button>
              </div>

              {/* Delete Shop */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isSubmitting || isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Shop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Shop</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &ldquo;{shop.name}&rdquo;?
                      This action cannot be undone. All shop items and data will
                      be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Deleting..." : "Delete Shop"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Card>

        {/* Shop Stats */}
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-semibold">Shop Statistics</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Items</p>
              <p className="font-semibold">{shop.shopItems.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-semibold">
                {new Date(shop.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-semibold">
                {new Date(shop.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Owner</p>
              <p className="font-semibold">{shop.owner.mcUsername}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
