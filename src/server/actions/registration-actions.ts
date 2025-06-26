"use server";

import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import {
  sendTellrawCommand,
  sendMessageToPlayer,
  checkPlayerOnline,
  getPlayerUUID,
} from "./rcon-actions";
import {
  stepOneSchema,
  stepTwoSchema,
  completeRegistrationSchema,
} from "~/lib/validations/auth";
import type { RegistrationResult } from "~/lib/types/auth";
import {
  generateOTP,
  formatOTPTellrawCommand,
  isOTPExpired,
  createOTPExpiration,
} from "~/server/utils/auth-utils";

/**
 * Step 1: Check if username is available and user is online, then send OTP
 */
export async function startRegistration(
  data: unknown,
): Promise<RegistrationResult> {
  try {
    const { mcUsername } = stepOneSchema.parse(data);

    const existingUser = await db.user.findUnique({
      where: { mcUsername },
    });

    if (existingUser) {
      return {
        success: false,
        error:
          "A user with this Minecraft username already exists. Please try logging in instead.",
      };
    }

    const playerOnlineCheck = await checkPlayerOnline({
      playerName: mcUsername,
    });

    if (!playerOnlineCheck.success) {
      return {
        success: false,
        error:
          "Unable to connect to the Minecraft server. Please try again later.",
      };
    }

    if (!playerOnlineCheck.isOnline) {
      return {
        success: false,
        error: `Player "${mcUsername}" is not currently online on the Minecraft server. Please join the server and try again.`,
      };
    }

    const otpCode = generateOTP();
    const expiresAt = createOTPExpiration();

    const tellrawCommand = formatOTPTellrawCommand(mcUsername, otpCode);
    const rconResult = await sendTellrawCommand({
      playerName: mcUsername,
      command: tellrawCommand,
    });

    if (!rconResult.success) {
      return {
        success: false,
        error:
          "Could not send verification code. Please make sure you are online on the Minecraft server and try again.",
      };
    }

    await db.registrationOTP.deleteMany({
      where: { mcUsername },
    });

    await db.registrationOTP.create({
      data: {
        mcUsername,
        otpCode,
        expiresAt,
      },
    });

    return {
      success: true,
      step: "otp-sent",
      message:
        "Verification code sent! Check your Minecraft chat and enter the 6-digit code below.",
    };
  } catch (err) {
    console.error("Registration step 1 error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Step 2: Verify OTP code
 */
export async function verifyOTP(data: unknown): Promise<RegistrationResult> {
  try {
    const { mcUsername, otpCode } = stepTwoSchema.parse(data);

    const otpRecord = await db.registrationOTP.findUnique({
      where: { mcUsername },
    });

    if (!otpRecord) {
      return {
        success: false,
        error:
          "No verification code found for this username. Please start the registration process again.",
      };
    }

    if (isOTPExpired(otpRecord.expiresAt)) {
      await db.registrationOTP.delete({
        where: { mcUsername },
      });
      return {
        success: false,
        error:
          "Verification code has expired. Please start the registration process again.",
      };
    }

    if (otpRecord.otpCode !== otpCode) {
      return {
        success: false,
        error:
          "Invalid verification code. Please check your Minecraft chat and try again.",
      };
    }

    await db.registrationOTP.update({
      where: { mcUsername },
      data: { verified: true },
    });

    return {
      success: true,
      step: "otp-verified",
      message:
        "Verification code confirmed! Now set your password to complete registration.",
    };
  } catch (err) {
    console.error("OTP verification error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Step 3: Complete registration with password
 */
export async function completeRegistration(
  data: unknown,
): Promise<RegistrationResult> {
  try {
    const { mcUsername, password } = completeRegistrationSchema.parse(data);

    const otpRecord = await db.registrationOTP.findUnique({
      where: { mcUsername },
    });

    if (
      !otpRecord ||
      !otpRecord.verified ||
      isOTPExpired(otpRecord.expiresAt)
    ) {
      return {
        success: false,
        error:
          "Verification code not found or expired. Please start the registration process again.",
      };
    }

    const existingUser = await db.user.findUnique({
      where: { mcUsername },
    });

    if (existingUser) {
      await db.registrationOTP.delete({
        where: { mcUsername },
      });
      return {
        success: false,
        error:
          "A user with this username already exists. Please try logging in instead.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Try to get player UUID via RCON
    let mcUUID: string | undefined;
    try {
      const uuidResult = await getPlayerUUID({ playerName: mcUsername });
      if (uuidResult.success && uuidResult.uuid) {
        mcUUID = uuidResult.uuid;
        console.log(`Retrieved UUID for ${mcUsername}: ${mcUUID}`);
      } else {
        console.warn(
          `Failed to get UUID for ${mcUsername}: ${uuidResult.error}`,
        );
      }
    } catch (error) {
      console.warn(`Error getting UUID for ${mcUsername}:`, error);
    }

    await db.user.create({
      data: {
        mcUsername,
        mcUUID,
        password: hashedPassword,
        name: mcUsername,
      },
    });

    await db.registrationOTP.delete({
      where: { mcUsername },
    });

    await sendMessageToPlayer({
      playerName: mcUsername,
      message:
        "§a[MC-Shop] §fRegistration completed successfully! You can now log in to the website.",
    });

    return {
      success: true,
      step: "completed",
      message:
        "Registration completed successfully! You can now log in with your credentials.",
    };
  } catch (error) {
    console.error("Registration completion error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Clean up expired OTP records (utility function)
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await db.registrationOTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to cleanup expired OTPs:", error);
  }
}

/**
 * Backfill UUIDs for existing users who don't have them
 * This can be called as a migration or for individual users
 */
export async function backfillUserUUID(mcUsername: string): Promise<{
  success: boolean;
  error?: string;
  uuid?: string;
}> {
  try {
    // Find user without UUID
    const user = await db.user.findUnique({
      where: { mcUsername },
      select: { id: true, mcUsername: true, mcUUID: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.mcUUID) {
      return {
        success: true,
        uuid: user.mcUUID,
      };
    }

    // Try to get UUID via RCON first (if player is online)
    try {
      const playerOnlineCheck = await checkPlayerOnline({
        playerName: mcUsername,
      });

      if (playerOnlineCheck.success && playerOnlineCheck.isOnline) {
        const uuidResult = await getPlayerUUID({ playerName: mcUsername });
        if (uuidResult.success && uuidResult.uuid) {
          await db.user.update({
            where: { mcUsername },
            data: { mcUUID: uuidResult.uuid },
          });

          console.log(
            `Backfilled UUID for ${mcUsername} via RCON: ${uuidResult.uuid}`,
          );
          return {
            success: true,
            uuid: uuidResult.uuid,
          };
        }
      }
    } catch (rconError) {
      console.warn(`RCON UUID fetch failed for ${mcUsername}:`, rconError);
    }

    // Fallback to Mojang API via our internal API route
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/minecraft/uuid?username=${encodeURIComponent(mcUsername)}`,
      );

      if (response.ok) {
        const data = (await response.json()) as { uuid: string };
        if (data.uuid) {
          await db.user.update({
            where: { mcUsername },
            data: { mcUUID: data.uuid },
          });

          console.log(
            `Backfilled UUID for ${mcUsername} via Mojang API: ${data.uuid}`,
          );
          return {
            success: true,
            uuid: data.uuid,
          };
        }
      }
    } catch (apiError) {
      console.warn(`API UUID fetch failed for ${mcUsername}:`, apiError);
    }

    return {
      success: false,
      error: "Could not retrieve UUID from any source",
    };
  } catch (error) {
    console.error(`Error backfilling UUID for ${mcUsername}:`, error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
