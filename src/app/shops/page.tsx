"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { getShops } from "~/server/actions/shops";
import Link from "next/link";
import { MapPin, Package, Plus } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  description: string | null;
  locationX: number | null;
  locationY: number | null;
  locationZ: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    mcUsername: string;
  };
  _count: {
    shopItems: number;
  };
}

export default function ShopsPage() {
  const { data: session, status } = useSession();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      loadShops();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      setError("Please login to view your shops");
    }
  }, [status]);

  const loadShops = async () => {
    try {
      const result = await getShops();
      if (result.success) {
        setShops(result.data.shops);
      } else {
        setError(result.error);
      }
    } catch (err) {
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
            <Card key={shop.id} className="overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{shop.name}</h3>
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${shop.isActive ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      <span className="text-sm text-gray-600">
                        {shop.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Owner: {shop.owner.mcUsername}
                    </p>
                  </div>
                </div>

                {shop.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {shop.description}
                  </p>
                )}

                <div className="mb-4 space-y-2">
                  {shop.locationX !== null &&
                    shop.locationY !== null &&
                    shop.locationZ !== null && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {shop.locationX}, {shop.locationY}, {shop.locationZ}
                        </span>
                      </div>
                    )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>{shop._count.shopItems} items</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href={`/shops/${shop.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/shops/${shop.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
