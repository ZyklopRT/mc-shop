"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "~/lib/i18n/routing";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { PageWrapper } from "~/components/ui/page-wrapper";
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
import { Link } from "~/lib/i18n/routing";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { toast } from "~/lib/utils/toast";

type EditShopForm = Omit<UpdateShopData, "shopId">;

export default function EditShopPage() {
  const t = useTranslations("page.shops-edit");
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
        toast.success(t("toast.updated"), t("toast.updatedDescription"));
        router.push(`/shops/${shop.id}`);
      } else {
        setError(result.error);
        toast.error(t("toast.updateFailed"), result.error);
      }
    } catch {
      setError(t("toast.unexpectedError"));
      toast.error(t("toast.updateFailed"), t("toast.unexpectedError"));
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
        toast.success(t("toast.deleted"), t("toast.deletedDescription"));
        router.push("/shops");
      } else {
        setError(result.error);
        toast.error(t("toast.deleteFailed"), result.error);
      }
    } catch {
      setError(t("toast.deleteFailed"));
      toast.error(t("toast.deleteFailed"), t("toast.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center">
          <p>{t("loading")}</p>
        </div>
      </PageWrapper>
    );
  }

  if (status === "unauthenticated") {
    return (
      <PageWrapper>
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">{t("authRequired")}</h1>
          <p className="text-muted-foreground mb-4">
            {t("authRequiredDescription")}
          </p>
          <Button asChild>
            <Link href="/auth/login">{t("login")}</Link>
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  if (error && !shop) {
    return (
      <PageWrapper>
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            {t("error.title")}
          </h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={loadShop}>{t("tryAgain")}</Button>
            <Button asChild variant="outline">
              <Link href="/shops">{t("backToShops")}</Link>
            </Button>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  if (!shop) {
    return (
      <PageWrapper>
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">{t("error.notFound")}</h1>
          <p className="text-muted-foreground mb-4">
            {t("error.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/shops">{t("backToShops")}</Link>
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  // Check if user is the owner
  const isOwner = session?.user?.mcUsername === shop.owner.mcUsername;

  if (!isOwner) {
    return (
      <PageWrapper>
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">{t("error.accessDenied")}</h1>
          <p className="text-muted-foreground mb-4">
            {t("error.accessDeniedDescription")}
          </p>
          <Button asChild>
            <Link href={`/shops/${shop.id}`}>{t("viewShop")}</Link>
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/shops/${shop.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToShop")}
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${shop.isActive ? "bg-green-500" : "bg-gray-400"}`}
            />
            <span className="text-muted-foreground text-sm">
              {shop.isActive ? t("active") : t("inactive")}
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
            <Label htmlFor="name">{t("form.shopName")}</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={t("form.shopNamePlaceholder")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("form.descriptionPlaceholder")}
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
            <Label>{t("form.location")}</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="locationX"
                  className="text-muted-foreground text-sm"
                >
                  {t("form.xCoordinate")}
                </Label>
                <Input
                  id="locationX"
                  type="number"
                  {...register("locationX", { valueAsNumber: true })}
                  placeholder={t("form.xPlaceholder")}
                  className={errors.locationX ? "border-red-500" : ""}
                />
                {errors.locationX && (
                  <p className="text-sm text-red-600">
                    {errors.locationX.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="locationY"
                  className="text-muted-foreground text-sm"
                >
                  {t("form.yCoordinate")}
                </Label>
                <Input
                  id="locationY"
                  type="number"
                  {...register("locationY", { valueAsNumber: true })}
                  placeholder={t("form.yPlaceholder")}
                  className={errors.locationY ? "border-red-500" : ""}
                />
                {errors.locationY && (
                  <p className="text-sm text-red-600">
                    {errors.locationY.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="locationZ"
                  className="text-muted-foreground text-sm"
                >
                  {t("form.zCoordinate")}
                </Label>
                <Input
                  id="locationZ"
                  type="number"
                  {...register("locationZ", { valueAsNumber: true })}
                  placeholder={t("form.zPlaceholder")}
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
              {t("form.isActive")}
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
                {isSubmitting ? t("form.saving") : t("form.saveChanges")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting || !isDirty}
              >
                {t("form.reset")}
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
                  {t("form.deleteShop")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteDialog.description", { shopName: shop.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    {t("form.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? t("form.deleting") : t("form.deleteShop")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </Card>

      {/* Shop Stats */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("statistics.title")}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">
              {t("statistics.totalItems")}
            </p>
            <p className="font-semibold">{shop.shopItems.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("statistics.created")}</p>
            <p className="font-semibold">
              {new Date(shop.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("statistics.lastUpdated")}
            </p>
            <p className="font-semibold">
              {new Date(shop.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("statistics.owner")}</p>
            <p className="font-semibold">{shop.owner.mcUsername}</p>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
