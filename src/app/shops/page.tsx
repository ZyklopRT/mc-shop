"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { getMyShopsWithItems } from "~/server/actions/shops";
import Link from "next/link";
import { Plus, Package } from "lucide-react";

import { ShopCard } from "~/components/shops/shop-card";
import type { ShopWithDetails, ShopItemWithItem } from "~/lib/types/shop";

interface Shop extends ShopWithDetails {
  shopItems: ShopItemWithItem[];
}

export default function ShopsPage() {
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      void loadShops();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      setError("Please login to view your shops");
    }
  }, [status]);

  const loadShops = async () => {
    try {
      const result = await getMyShopsWithItems();
      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load shops");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p>Loading shops...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Authentication Required</h1>
          <p className="mb-4 text-gray-600">
            Please login to manage your shops.
          </p>
          <Button asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button onClick={loadShops}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Shops</h1>
          <p className="text-gray-600">Manage your Minecraft shops</p>
        </div>
        <Button asChild>
          <Link href="/shops/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Shop
          </Link>
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">No shops yet</h2>
          <p className="mb-4 text-gray-600">
            Create your first shop to start selling items to other players.
          </p>
          <Button asChild>
            <Link href="/shops/new">Create Your First Shop</Link>
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
    </div>
  );
}
