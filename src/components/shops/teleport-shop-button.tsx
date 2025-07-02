"use client";

import { Loader2, Navigation } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTeleportToShop } from "~/hooks/use-teleport-to-shop";

interface TeleportShopButtonProps {
  mcUsername: string;
  shopName: string;
  x: number;
  y: number;
  z: number;
  variant?: "outline" | "default";
}

export function TeleportShopButton({
  mcUsername,
  shopName,
  x,
  y,
  z,
  variant = "default",
}: TeleportShopButtonProps) {
  const { handleTeleport, isSubmitting } = useTeleportToShop({
    mcUsername,
    shopName,
    x,
    y,
    z,
  });

  return (
    <Button
      onClick={handleTeleport}
      disabled={isSubmitting}
      variant={variant}
      size="sm"
      className="w-full"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Navigation className="mr-2 h-4 w-4" />
          Get Teleport
        </>
      )}
    </Button>
  );
}
