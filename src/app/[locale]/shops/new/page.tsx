"use client";

import { useState } from "react";
import { useRouter, Link } from "~/lib/i18n/routing";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { createShop } from "~/server/actions/shops";
import { createShopSchema } from "~/lib/validations/shop";
import { ArrowLeft } from "lucide-react";
import { toast } from "~/lib/utils/toast";
import { useTranslations } from "next-intl";

// Form schema with required isActive field
const createShopFormSchema = createShopSchema.extend({
  isActive: z.boolean(),
});

type CreateShopForm = z.infer<typeof createShopFormSchema>;

export default function NewShopPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("page.shops-new");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CreateShopForm>({
    resolver: zodResolver(createShopFormSchema),
    defaultValues: {
      isActive: true,
      locationX: 0,
      locationY: 0,
      locationZ: 0,
    },
  });

  const onSubmit = async (data: CreateShopForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert string inputs to numbers for coordinates
      const formData = {
        ...data,
        locationX: data.locationX ? Number(data.locationX) : undefined,
        locationY: data.locationY ? Number(data.locationY) : undefined,
        locationZ: data.locationZ ? Number(data.locationZ) : undefined,
      };

      const result = await createShop(formData);

      if (result.success) {
        toast.success(t("toast.created"), t("toast.createdDescription"));
        router.push(`/shops/${result.data.id}`);
      } else {
        setError(result.error);
        toast.error(t("toast.creationFailed"), result.error);
      }
    } catch {
      setError(t("toast.unexpectedError"));
      toast.error(t("toast.creationFailed"), t("toast.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
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

  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/shops">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToShops")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("form.shopName")} *</Label>
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
              <textarea
                id="description"
                {...register("description")}
                placeholder={t("form.descriptionPlaceholder")}
                className={`border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.description ? "border-red-500" : ""
                }`}
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
              <p className="text-muted-foreground text-sm">
                {t("form.locationHelp")}
              </p>
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

            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t("form.creating") : t("form.createShop")}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/shops">{t("form.cancel")}</Link>
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Text */}
        <Card className="mt-6 p-4">
          <h3 className="mb-2 font-semibold">{t("help.title")}</h3>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>• {t("help.tip1")}</li>
            <li>• {t("help.tip2")}</li>
            <li>• {t("help.tip3")}</li>
            <li>• {t("help.tip4")}</li>
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
}
