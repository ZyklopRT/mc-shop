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
