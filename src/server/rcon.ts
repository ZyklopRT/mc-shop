import { RCONClient } from "@minecraft-js/rcon";
import { z } from "zod";

// Configuration schema for RCON connection
const rconConfigSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535),
  password: z.string().min(1, "Password is required"),
});

// Command execution result type
export interface RconCommandResult {
  success: boolean;
  response?: string;
  error?: string;
  executionTime?: number;
}

/**
 * Simple Minecraft RCON Service following the official documentation
 */
export class MinecraftRconService {
  private config: z.infer<typeof rconConfigSchema>;
  private commandTimeout = 30000; // 30 seconds

  constructor(config: z.infer<typeof rconConfigSchema>) {
    this.config = rconConfigSchema.parse(config);
    this.log("info", "RCON service initialized");
  }

  /**
   * Simple logging utility
   */
  private log(level: "info" | "warn" | "error", message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [RCON] ${level.toUpperCase()}: ${message}`);
  }

  /**
   * Execute a command using the recommended approach from the documentation
   */
  public async executeCommand(command: string): Promise<RconCommandResult> {
    const startTime = Date.now();
    this.log("info", `Executing command: ${command}`);

    // Validate command
    if (!command || command.trim().length === 0) {
      return { success: false, error: "Command cannot be empty" };
    }

    let client: RCONClient | null = null;

    try {
      // Create client as shown in documentation
      client = new RCONClient(
        this.config.host,
        this.config.password,
        this.config.port,
      );

      // Connect
      client.connect();

      // Wait for connection (simple approach)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Execute command using the recommended async method
      const response = await client.executeCommandAsync(
        command.trim(),
        this.commandTimeout,
      );

      const executionTime = Date.now() - startTime;
      this.log("info", `Command executed successfully in ${executionTime}ms`);

      return {
        success: true,
        response,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.log("error", `Command failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        executionTime,
      };
    } finally {
      // Always disconnect
      if (client) {
        try {
          client.disconnect();
        } catch (disconnectError) {
          const errorMsg =
            disconnectError instanceof Error
              ? disconnectError.message
              : "Unknown error";
          this.log("warn", `Error during disconnect: ${errorMsg}`);
        }
      }
    }
  }

  /**
   * Send a message to a specific player
   */
  public async sendMessageToPlayer(
    playerName: string,
    message: string,
  ): Promise<RconCommandResult> {
    const command = `tell ${playerName} ${message}`;
    return this.executeCommand(command);
  }

  /**
   * Test connection by listing players
   */
  public async testConnection(): Promise<RconCommandResult> {
    return this.executeCommand("list");
  }

  /**
   * Create service from environment variables
   */
  public static fromEnvironment(): MinecraftRconService {
    const config = {
      host: process.env.MINECRAFT_RCON_HOST ?? "localhost",
      port: parseInt(process.env.MINECRAFT_RCON_PORT ?? "25575", 10),
      password: process.env.MINECRAFT_RCON_PASSWORD ?? "",
    };

    if (!config.password) {
      throw new Error(
        "MINECRAFT_RCON_PASSWORD environment variable is required",
      );
    }

    return new MinecraftRconService(config);
  }
}

export { rconConfigSchema };
