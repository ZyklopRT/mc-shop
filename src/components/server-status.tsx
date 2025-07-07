"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  getPlayerCount,
  type PlayerCount,
} from "~/server/actions/server-status";

export function ServerStatus() {
  const t = useTranslations("navigation.serverStatus");
  const [playerData, setPlayerData] = useState<PlayerCount | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const result = await getPlayerCount();
      setPlayerData(result);
    };

    void fetchCount();
    const interval = setInterval(() => {
      void fetchCount();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  if (!playerData) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span>
              {playerData.online}/{playerData.max}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p>
              {t("players", { online: playerData.online, max: playerData.max })}
            </p>
            {playerData.players.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">{t("onlinePlayers")}</p>
                <div className="space-y-1">
                  {playerData.players.map((player, index) => (
                    <div
                      key={index}
                      className="bg-background text-muted-foreground flex items-center justify-between rounded px-2 py-1 text-xs"
                    >
                      <span>{player}</span>
                      <div className="bg-primary h-2 w-2 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {playerData.players.length === 0 && playerData.online === 0 && (
              <p className="text-muted-foreground text-xs">
                {t("noPlayersOnline")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
