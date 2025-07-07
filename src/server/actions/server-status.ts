"use server";

import { MinecraftRconService } from "~/server/rcon";

export interface PlayerCount {
  online: number;
  max: number;
  players: string[];
}

/**
 * Get player count and online players using RCON 'list' command
 */
export async function getPlayerCount(): Promise<PlayerCount | null> {
  try {
    const rcon = MinecraftRconService.fromEnvironment();
    const result = await rcon.executeCommand("list");

    if (!result.success || !result.response) {
      return null;
    }

    // Parse the 'list' command output
    // Format is: "There are 5 of a max of 20 players online: player1, player2, player3"
    const countMatch = /There are (\d+) of a max of (\d+) players online/.exec(
      result.response,
    );

    if (!countMatch?.[1] || !countMatch?.[2]) {
      return null;
    }

    const online = parseInt(countMatch[1], 10);
    const max = parseInt(countMatch[2], 10);

    // Extract player names (after the colon)
    const players: string[] = [];
    const colonIndex = result.response.indexOf(":");
    if (colonIndex !== -1 && online > 0) {
      const playersPart = result.response.substring(colonIndex + 1).trim();
      if (playersPart) {
        players.push(...playersPart.split(",").map((name) => name.trim()));
      }
    }

    return {
      online,
      max,
      players,
    };
  } catch (error) {
    console.error("Failed to get player count via RCON:", error);
    return null;
  }
}
