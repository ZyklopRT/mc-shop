"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { getShopDetails } from "~/server/actions/shops";
import { CURRENCY_TYPES } from "~/lib/validations/shop";
import type { ShopWithItems } from "~/lib/types/shop";
import Link from "next/link";
import { ArrowLeft, MapPin, Package, Plus, Edit } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { ItemPreviewCompact } from "~/components/items/item-preview";

export default function ShopDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const shopId = params.id as string;

  const [shop, setShop] = useState<ShopWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shopId) {
      void loadShop();
    }
  }, [shopId]);

  const loadShop = async () => {
    try {
      const result = await getShopDetails({ shopId, includeItems: true });
      if (result.success) {
        setShop(result.data.shop);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load shop details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p>Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="mb-4 text-gray-600">{error ?? "Shop not found"}</p>
          <Button asChild>
            <Link href="/shops">Back to Shops</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const isOwner = session?.user?.id === shop.owner.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/shops">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shops
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{shop.name}</h1>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${shop.isActive ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span className="text-sm text-gray-600">
                  {shop.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <p className="text-gray-600">Owner: {shop.owner.mcUsername}</p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/shops/${shop.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Shop
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/shops/${shop.id}/items/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Items
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
            <h2 className="mb-4 text-xl font-semibold">Shop Information</h2>

            {shop.description && (
              <div className="mb-4">
                <h3 className="mb-2 font-medium text-gray-700">Description</h3>
                <p className="text-gray-600">{shop.description}</p>
              </div>
            )}

            {shop.locationX !== null &&
              shop.locationY !== null &&
              shop.locationZ !== null && (
                <div className="mb-4">
                  <h3 className="mb-2 font-medium text-gray-700">Location</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {shop.locationX}, {shop.locationY}, {shop.locationZ}
                    </span>
                  </div>
                </div>
              )}

            <div className="mb-4">
              <h3 className="mb-2 font-medium text-gray-700">Statistics</h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4" />
                <span>{shop.shopItems.length} items available</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium text-gray-700">Created</h3>
              <p className="text-gray-600">
                {new Date(shop.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Shop Items */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Items for Sale</h2>
              {isOwner && shop.shopItems.length > 0 && (
                <Button asChild size="sm">
                  <Link href={`/shops/${shop.id}/items/add`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add More
                  </Link>
                </Button>
              )}
            </div>

            {shop.shopItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">No items yet</h3>
                <p className="mb-4 text-gray-600">
                  {isOwner
                    ? "Start adding items to your shop to attract customers."
                    : "This shop doesn't have any items for sale yet."}
                </p>
                {isOwner && (
                  <Button asChild>
                    <Link href={`/shops/${shop.id}/items/add`}>
                      Add Your First Item
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {shop.shopItems.map((shopItem) => (
                  <div key={shopItem.id} className="relative">
                    <ItemPreviewCompact
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
    </div>
  );
}
