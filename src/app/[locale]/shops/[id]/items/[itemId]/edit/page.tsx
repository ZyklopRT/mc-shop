"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, Link } from "~/lib/i18n/routing";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, Trash2, Save, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

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

const editShopItemFormSchema = updateShopItemSchema.omit({ shopItemId: true });
type EditShopItemForm = z.infer<typeof editShopItemFormSchema>;

export default function EditShopItemPage() {
  const t = useTranslations("page.shops-items-edit");
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
      setError(t("error.failedToLoadShopItem"));
      toast.error(t("error.failedToLoadShopItem"));
    } finally {
      setIsLoading(false);
    }
  }, [shopItemId, reset, t]);

  useEffect(() => {
    if (shopItemId) {
      void loadShopItem();
    }
  }, [shopItemId, loadShopItem]);
  useEffect(() => {
    if (shopItem?.shop && "ownerId" in shopItem.shop && session?.user?.id) {
      const isOwner = session.user.id === shopItem.shop.ownerId;
      if (!isOwner) {
        toast.error(t("toast.checkPermissions"));
        router.push(`/shops/${shopId}`);
      }
    }
  }, [shopItem, session?.user?.id, shopId, router, t]);

  const onSubmit = async (data: EditShopItemForm) => {
    if (!session?.user?.id) {
      toast.error(t("toast.authRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateShopItem({
        shopItemId,
        ...data,
      });

      if (result.success) {
        toast.success(t("toast.updated"));
        router.push(`/shops/${shopId}`);
      } else {
        if (
          result.error.includes("permission") ||
          result.error.includes("access denied")
        ) {
          toast.error(t("toast.permissionDenied"));
          router.push(`/shops/${shopId}`);
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error(t("toast.updateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.user?.id) {
      toast.error(t("toast.authRequired"));
      return;
    }

    setIsDeleting(true);

    try {
      const result = await removeItemFromShop({ shopItemId });

      if (result.success) {
        toast.success(t("toast.removed"));
        router.push(`/shops/${shopId}`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("toast.removeFailed"));
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
          <div className="text-lg">{t("loading")}</div>
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
            <p className="text-destructive">
              {error ?? t("error.shopItemNotFound")}
            </p>
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
          <div className="text-lg">{t("checkingPermissions")}</div>
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
            {t("backToShop", { shopName: shopItem.shop?.name ?? "Shop" })}
          </Link>
        </Button>

        <div className="mb-2 flex items-center gap-3">
          <Pencil className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form.cardTitle")}</CardTitle>
          <CardDescription>{t("form.cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t("form.currentItem")}
            </h3>
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
              <Label htmlFor="price">{t("form.price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                {...register("price", { valueAsNumber: true })}
                placeholder={t("form.pricePlaceholder")}
              />
              {errors.price && (
                <p className="text-destructive text-sm">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t("form.amount")}</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                {...register("amount", { valueAsNumber: true })}
                placeholder={t("form.amountPlaceholder")}
              />
              {errors.amount && (
                <p className="text-destructive text-sm">
                  {errors.amount.message}
                </p>
              )}
              <p className="text-muted-foreground text-sm">
                {t("form.amountHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("form.currency")}</Label>
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
                  <SelectValue placeholder={t("form.currencyPlaceholder")} />
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
              <Label htmlFor="isAvailable">{t("form.isAvailable")}</Label>
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
                    {t("form.removeFromShop")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteDialog.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteDialog.description", {
                        itemName:
                          shopItem.item.nameEn ??
                          shopItem.item.id ??
                          "Unknown Item",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("deleteDialog.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("deleteDialog.removeItem")}
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
                  {t("form.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? t("form.saving") : t("form.saveChanges")}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
