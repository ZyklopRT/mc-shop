"use server";

import { z } from "zod";
import { MinecraftRconService, type RconCommandResult } from "../rcon";

// Schema for sending messages to players
const sendMessageSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
  message: z.string().min(1, "Message is required"),
});

// Schema for sending tellraw commands
const sendTellrawSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
  command: z.string().min(1, "Tellraw command is required"),
});

// Schema for checking if player is online
const checkPlayerOnlineSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
});

// Schema for getting player UUID
const getPlayerUUIDSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
});

/**
 * Check if a player is currently online on the server
 */
export async function checkPlayerOnline(
  data: z.infer<typeof checkPlayerOnlineSchema>,
): Promise<RconCommandResult & { isOnline?: boolean }> {
  try {
    const validatedData = checkPlayerOnlineSchema.parse(data);
    const rconService = MinecraftRconService.fromEnvironment();

    // Use the 'list' command to get all online players
    const listResult = await rconService.executeCommand("list");

    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error ?? "Failed to check player status",
        isOnline: false,
      };
    }

    // Parse the response to check if the player is in the list
    // Minecraft 'list' command returns something like:
    // "There are 2/20 players online: Player1, Player2"
    // or "There are 0 of a max of 20 players online"
    const response = listResult.response ?? "";
    const playerName = validatedData.playerName;

    // More accurate parsing: extract the player list part after the colon
    const colonIndex = response.indexOf(":");
    if (colonIndex === -1) {
      // No colon means no players online or different format
      return {
        success: true,
        response: listResult.response,
        isOnline: false,
        executionTime: listResult.executionTime,
      };
    }

    // Get the part after the colon which contains the player names
    const playerListPart = response.substring(colonIndex + 1).trim();

    if (!playerListPart) {
      // Empty after colon means no players
      return {
        success: true,
        response: listResult.response,
        isOnline: false,
        executionTime: listResult.executionTime,
      };
    }

    // Split by comma and check exact matches (case-insensitive)
    const onlinePlayers = playerListPart
      .split(",")
      .map((name) => name.trim().toLowerCase());

    const isOnline = onlinePlayers.includes(playerName.toLowerCase());

    return {
      success: true,
      response: listResult.response,
      isOnline,
      executionTime: listResult.executionTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      isOnline: false,
    };
  }
}

/**
 * Send a message to a specific player via RCON
 * This is a simple test function to verify RCON connectivity
 */
export async function sendMessageToPlayer(
  data: z.infer<typeof sendMessageSchema>,
): Promise<RconCommandResult> {
  try {
    const validatedData = sendMessageSchema.parse(data);
    const rconService = MinecraftRconService.fromEnvironment();

    return await rconService.sendMessageToPlayer(
      validatedData.playerName,
      validatedData.message,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send a tellraw command via RCON
 * Used for formatted messages with clickable elements
 */
export async function sendTellrawCommand(
  data: z.infer<typeof sendTellrawSchema>,
): Promise<RconCommandResult> {
  try {
    const validatedData = sendTellrawSchema.parse(data);
    const rconService = MinecraftRconService.fromEnvironment();

    return await rconService.executeCommand(validatedData.command);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get player UUID via RCON with multiple fallback approaches
 * Tries various RCON commands and falls back to Mojang API
 */
export async function getPlayerUUID(
  data: z.infer<typeof getPlayerUUIDSchema>,
): Promise<RconCommandResult & { uuid?: string }> {
  try {
    const validatedData = getPlayerUUIDSchema.parse(data);
    const rconService = MinecraftRconService.fromEnvironment();
    const playerName = validatedData.playerName;

    // First, check if player is online
    const onlineCheck = await checkPlayerOnline({ playerName });
    if (!onlineCheck.success) {
      return {
        success: false,
        error: "Cannot connect to server to check player status",
      };
    }

    if (!onlineCheck.isOnline) {
      // Player is offline, try Mojang API fallback
      console.log(`Player ${playerName} is offline, trying Mojang API...`);
      return await getUUIDFromMojangAPI(playerName);
    }

    // Try multiple RCON approaches for online players
    const rconAttempts = [
      // Approach 1: Standard data get entity command
      `data get entity ${playerName} UUID`,
      // Approach 2: Try with @a selector
      `data get entity @a[name=${playerName},limit=1] UUID`,
      // Approach 3: Try alternative data command format
      `data get entity ${playerName}`,
    ];

    for (let i = 0; i < rconAttempts.length; i++) {
      const command = rconAttempts[i]!;
      console.log(`Attempt ${i + 1}: Trying RCON command: ${command}`);

      try {
        const result = await rconService.executeCommand(command);

        if (result.success && result.response) {
          // Try to parse UUID from response
          const uuid = parseUUIDFromResponse(result.response);
          if (uuid) {
            console.log(`Successfully extracted UUID via RCON: ${uuid}`);
            return {
              success: true,
              response: result.response,
              uuid,
              executionTime: result.executionTime,
            };
          }
        }

        // Log the attempt for debugging
        console.log(
          `Attempt ${i + 1} failed or no UUID found. Response: ${result.response}`,
        );
      } catch (error) {
        console.log(`Attempt ${i + 1} threw error:`, error);
      }
    }

    // All RCON attempts failed, fall back to Mojang API
    console.log(
      `All RCON attempts failed for ${playerName}, trying Mojang API...`,
    );
    return await getUUIDFromMojangAPI(playerName);
  } catch (error) {
    console.error(`Error in getPlayerUUID for ${JSON.stringify(data)}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Parse UUID from various RCON response formats
 */
function parseUUIDFromResponse(response: string): string | null {
  try {
    // Format 1: "[I; 123456789, 987654321, 456789123, 789123456]"
    const uuidArrayRegex = /\[I;\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+)\]/;
    const uuidArrayMatch = uuidArrayRegex.exec(response);

    if (uuidArrayMatch && uuidArrayMatch.length === 5) {
      const a = Number(uuidArrayMatch[1]);
      const b = Number(uuidArrayMatch[2]);
      const c = Number(uuidArrayMatch[3]);
      const d = Number(uuidArrayMatch[4]);

      // Convert signed 32-bit integers to unsigned and then to hex
      const toHex = (num: number) => {
        return (num >>> 0).toString(16).padStart(8, "0");
      };

      return `${toHex(a)}-${toHex(b).slice(0, 4)}-${toHex(b).slice(4)}-${toHex(c).slice(0, 4)}-${toHex(c).slice(4)}${toHex(d)}`;
    }

    // Format 2: Look for UUID in string format "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    const uuidStringRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const uuidStringMatch = uuidStringRegex.exec(response);

    if (uuidStringMatch?.[0]) {
      return uuidStringMatch[0].toLowerCase();
    }

    // Format 3: Look for "UUID: [I; ...]" format
    const uuidPrefixRegex =
      /UUID:\s*\[I;\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+)\]/;
    const uuidPrefixMatch = uuidPrefixRegex.exec(response);

    if (uuidPrefixMatch && uuidPrefixMatch.length === 5) {
      const a = Number(uuidPrefixMatch[1]);
      const b = Number(uuidPrefixMatch[2]);
      const c = Number(uuidPrefixMatch[3]);
      const d = Number(uuidPrefixMatch[4]);

      const toHex = (num: number) => {
        return (num >>> 0).toString(16).padStart(8, "0");
      };

      return `${toHex(a)}-${toHex(b).slice(0, 4)}-${toHex(b).slice(4)}-${toHex(c).slice(0, 4)}-${toHex(c).slice(4)}${toHex(d)}`;
    }

    return null;
  } catch (error) {
    console.error("Error parsing UUID from response:", error);
    return null;
  }
}

/**
 * Fallback to Mojang API for UUID lookup
 */
async function getUUIDFromMojangAPI(
  playerName: string,
): Promise<RconCommandResult & { uuid?: string }> {
  try {
    console.log(`Fetching UUID for ${playerName} from Mojang API...`);

    const response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${playerName}`,
      {
        // Cache for 1 hour since UUIDs don't change
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Player "${playerName}" not found in Mojang database`,
        };
      }
      return {
        success: false,
        error: `Mojang API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as { id?: string; name?: string };

    if (!data.id) {
      return {
        success: false,
        error: "No UUID returned from Mojang API",
      };
    }

    // Format the UUID properly (Mojang returns without dashes)
    const rawUuid = data.id;
    const formattedUuid = `${rawUuid.slice(0, 8)}-${rawUuid.slice(8, 12)}-${rawUuid.slice(12, 16)}-${rawUuid.slice(16, 20)}-${rawUuid.slice(20)}`;

    console.log(
      `Successfully retrieved UUID from Mojang API: ${formattedUuid}`,
    );

    return {
      success: true,
      response: `Retrieved from Mojang API: ${data.name} -> ${formattedUuid}`,
      uuid: formattedUuid,
    };
  } catch (error) {
    console.error("Mojang API error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch UUID from Mojang API",
    };
  }
}
