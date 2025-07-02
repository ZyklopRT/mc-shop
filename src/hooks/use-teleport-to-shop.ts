import { useState } from "react";
import { toast } from "sonner";
import { sendShopTeleportCommand } from "~/server/actions/rcon-actions";

interface UseTeleportToShopParams {
  mcUsername: string;
  shopName: string;
  x: number;
  y: number;
  z: number;
}

export function useTeleportToShop({
  mcUsername,
  shopName,
  x,
  y,
  z,
}: UseTeleportToShopParams) {
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
        toast.success("Teleport Command Sent", {
          description: `A clickable teleport message has been sent to your Minecraft chat. Click it to teleport to ${shopName}!`,
        });
      } else {
        toast.error("Failed to Send Command", {
          description:
            result.error ??
            "Could not send teleport command. Make sure you're online in Minecraft.",
        });
      }
    } catch {
      toast.error("Error", {
        description:
          "An unexpected error occurred while sending the teleport command.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleTeleport,
    isSubmitting,
  };
}
