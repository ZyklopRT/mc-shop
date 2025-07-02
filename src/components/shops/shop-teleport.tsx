import { MapPin } from "lucide-react";
import { TeleportShopButton } from "./teleport-shop-button";

interface ShopTeleportProps {
  shopName: string;
  x: number;
  y: number;
  z: number;
  mcUsername: string;
}

export function ShopTeleport({
  shopName,
  x,
  y,
  z,
  mcUsername,
}: ShopTeleportProps) {
  return (
    <div className="space-y-3">
      {/* Location Display */}
      <div className="text-muted-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <span className="font-mono">
          {x}, {y}, {z}
        </span>
      </div>

      {/* Teleport Button */}
      <TeleportShopButton
        mcUsername={mcUsername}
        shopName={shopName}
        x={x}
        y={y}
        z={z}
      />

      <p className="text-muted-foreground text-sm">
        Sends a clickable teleport command to your Minecraft chat
      </p>
    </div>
  );
}
