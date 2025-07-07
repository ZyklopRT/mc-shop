"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { PageHeader } from "~/components/ui/page-header";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { getMyShopsWithItems } from "~/server/actions/shops";
import { Link } from "~/lib/i18n/routing";
import { Plus, Package, User } from "lucide-react";

import { ShopCard } from "~/components/shops/shop-card";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";

interface Shop extends ShopWithDetails {
  shopItems: ShopItemWithItem[];
}

export default function ShopsPage() {
  const t = useTranslations("page.shops");
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShops = useCallback(async () => {
    try {
      const result = await getMyShopsWithItems();
      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
      }
    } catch {
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === "authenticated") {
      void loadShops();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      setError(t("authRequiredDescription"));
    }
  }, [status, loadShops, t]);

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

  if (error) {
    return (
      <PageWrapper>
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">{t("error")}</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadShops}>{t("tryAgain")}</Button>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={<User className="h-8 w-8" />}
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild>
            <Link href="/shops/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("createShop")}
            </Link>
          </Button>
        }
      />

      {shops.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">{t("noShopsYet")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("noShopsYetDescription")}
          </p>
          <Button asChild>
            <Link href="/shops/new">{t("createYourFirstShop")}</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              currentUserId={session?.user?.id}
              showEditButton={true}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
