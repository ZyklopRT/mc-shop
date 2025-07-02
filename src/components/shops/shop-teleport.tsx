"use client";

import { useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "~/lib/utils/toast";

import { Button } from "~/components/ui/button";
import { sendShopTeleportCommand } from "~/server/actions/rcon-actions";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTeleport = async () => {
    setIsSubmitting(true);

    try {
      const result = await sendShopTeleportCommand({
        playerName: mcUsername,
        shopName,
        x,
        y,
        z,
      });

      if (result.success) {
        toast.success(
          "Teleport Command Sent",
          `A clickable teleport message has been sent to your Minecraft chat. Click it to teleport to ${shopName}!`,
        );
      } else {
        toast.error(
          "Failed to Send Command",
          result.error ??
            "Could not send teleport command. Make sure you're online in Minecraft.",
        );
      }
    } catch {
      toast.error(
        "Error",
        "An unexpected error occurred while sending the teleport command.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <Button
        onClick={handleTeleport}
        disabled={isSubmitting}
        variant="outline"
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

      <p className="text-muted-foreground text-sm">
        Sends a clickable teleport command to your Minecraft chat
      </p>
    </div>
  );
}
