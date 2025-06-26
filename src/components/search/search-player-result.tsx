"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Store, ChevronRight } from "lucide-react";
import { getMinecraftAvatarUrl } from "~/lib/utils/minecraft-api";
import type { PlayerSearchResult } from "~/lib/types/search";

interface SearchPlayerResultProps {
  player: PlayerSearchResult;
  onClick?: () => void;
}

export function SearchPlayerResult({
  player,
  onClick,
}: SearchPlayerResultProps) {
  // Only generate avatar URL if we have a UUID
  const avatarUrl = player.mcUUID
    ? getMinecraftAvatarUrl(player.mcUUID, 32, true)
    : undefined;

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <Card
      className="hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-2">
        <div className="flex items-center gap-3">
          {/* Player Avatar */}
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={player.mcUsername} />
            <AvatarFallback className="text-xs">
              {getInitials(player.mcUsername)}
            </AvatarFallback>
          </Avatar>

          {/* Player Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium">
                  {player.mcUsername}
                </h4>
              </div>

              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Store className="h-3 w-3" />
                <span>{player.shopCount}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            {/* Shop Status */}
            <div className="mt-1 flex items-center gap-2">
              <p className="text-muted-foreground text-xs">
                {player.shopCount === 0
                  ? "No shops"
                  : `${player.shopCount} shop${player.shopCount === 1 ? "" : "s"}`}
              </p>
              {player.hasActiveShops && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
