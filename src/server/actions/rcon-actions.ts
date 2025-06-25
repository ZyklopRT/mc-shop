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
