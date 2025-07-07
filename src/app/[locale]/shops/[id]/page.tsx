"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "~/lib/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { getShopDetails } from "~/server/actions/shops";

import type { ShopWithItems } from "~/lib/types/shop";
import { Link } from "~/lib/i18n/routing";
import { ArrowLeft, MapPin, Package, Plus, Edit } from "lucide-react";

import { ItemPreview } from "~/components/items/item-preview";
import { ShopTeleport } from "~/components/shops";
import { hasValidTeleportCoordinates } from "~/lib/utils/coordinates";

export default function ShopDetailsPage() {
  const t = useTranslations("page.shops-details");
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const shopId = params.id as string;

  const [shop, setShop] = useState<ShopWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShop = async () => {
      try {
        const result = await getShopDetails({ shopId, includeItems: true });
        if (result.success) {
          setShop(result.data.shop);
        } else {
          setError(result.error);
        }
      } catch {
        setError(t("error.failedToLoadShop"));
      } finally {
        setIsLoading(false);
      }
    };

    if (shopId) {
      void loadShop();
    }
  }, [shopId, t]);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center">
          <p>{t("loading")}</p>
        </div>
      </PageWrapper>
    );
  }

  if (error || !shop) {
    return (
      <PageWrapper>
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            {t("error.title")}
          </h1>
          <p className="text-muted-foreground mb-4">
            {error ?? t("error.shopNotFound")}
          </p>
          <Button asChild>
            <Link href="/shops">{t("backToShops")}</Link>
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  const isOwner = session?.user?.id === shop.owner.id;

  return (
    <PageWrapper>
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/shops">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToShops")}
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{shop.name}</h1>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${shop.isActive ? "bg-green-500" : "bg-muted-foreground"}`}
                />
                <span className="text-muted-foreground text-sm">
                  {shop.isActive ? t("active") : t("inactive")}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              {t("owner")} {shop.owner.mcUsername}
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/shops/${shop.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("editShop")}
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/shops/${shop.id}/items/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addItems")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shop Info */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {t("shopInformation")}
            </h2>

            {shop.description && (
              <div className="mb-4">
                <h3 className="text-foreground mb-2 font-medium">
                  {t("description")}
                </h3>
                <p className="text-muted-foreground">{shop.description}</p>
              </div>
            )}

            {shop.locationX !== null &&
              shop.locationY !== null &&
              shop.locationZ !== null && (
                <div className="mb-4">
                  <h3 className="text-foreground mb-2 font-medium">
                    {t("location")}
                  </h3>
                  {hasValidTeleportCoordinates(
                    shop.locationX,
                    shop.locationY,
                    shop.locationZ,
                  ) && session?.user?.mcUsername ? (
                    <ShopTeleport
                      shopName={shop.name}
                      x={shop.locationX}
                      y={shop.locationY}
                      z={shop.locationZ}
                      mcUsername={session.user.mcUsername}
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-mono">
                          {shop.locationX}, {shop.locationY}, {shop.locationZ}
                        </span>
                      </div>
                      {hasValidTeleportCoordinates(
                        shop.locationX,
                        shop.locationY,
                        shop.locationZ,
                      ) &&
                        !session?.user?.mcUsername && (
                          <p className="text-muted-foreground text-sm">
                            {t("loginToGetTeleportCommands")}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}

            <div className="mb-4">
              <h3 className="text-foreground mb-2 font-medium">
                {t("statistics")}
              </h3>
              <div className="text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>
                  {shop.shopItems.length} {t("itemsAvailable")}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-foreground mb-2 font-medium">
                {t("created")}
              </h3>
              <p className="text-muted-foreground">
                {new Date(shop.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Shop Items */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("itemsForSale")}</h2>
              {isOwner && shop.shopItems.length > 0 && (
                <Button asChild size="sm">
                  <Link href={`/shops/${shop.id}/items/add`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addMore")}
                  </Link>
                </Button>
              )}
            </div>

            {shop.shopItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="text-foreground mb-2 text-lg font-semibold">
                  {t("noItemsYet")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isOwner ? t("startAddingItems") : t("noItemsForSale")}
                </p>
                {isOwner && (
                  <Button asChild>
                    <Link href={`/shops/${shop.id}/items/add`}>
                      {t("addYourFirstItem")}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {shop.shopItems.map((shopItem) => (
                  <div key={shopItem.id} className="relative">
                    <ItemPreview
                      item={shopItem.item}
                      price={shopItem.price}
                      amount={shopItem.amount}
                      currency={shopItem.currency}
                      isAvailable={shopItem.isAvailable}
                      onEdit={
                        isOwner
                          ? () => {
                              router.push(
                                `/shops/${shop.id}/items/${shopItem.id}/edit`,
                              );
                            }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
