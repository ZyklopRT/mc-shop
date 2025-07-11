"use server";

import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import {
  sendTellrawCommand,
  sendMessageToPlayer,
  checkPlayerOnline,
} from "./rcon-actions";
import {
  stepOneSchema,
  stepTwoSchema,
  completePasswordRecoverySchema,
} from "~/lib/validations/auth";
import type { PasswordRecoveryResult } from "~/lib/types/auth";
import {
  generateOTP,
  formatOTPTellrawCommand,
  isOTPExpired,
  createOTPExpiration,
} from "~/server/utils/auth-utils";

/**
 * Step 1: Check if user exists and is online, then send OTP for password recovery
 */
export async function startPasswordRecovery(
  data: unknown,
): Promise<PasswordRecoveryResult> {
  try {
    const { mcUsername } = stepOneSchema.parse(data);

    const existingUser = await db.user.findUnique({
      where: { mcUsername },
    });

    if (!existingUser) {
      return {
        success: false,
        error:
          "No account found with this Minecraft username. Please check your username or register a new account.",
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

    // Clean up any existing OTP records for this username
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
        "Password recovery code sent! Check your Minecraft chat and enter the 6-digit code below.",
    };
  } catch (err) {
    console.error("Password recovery step 1 error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Step 2: Verify OTP code for password recovery
 */
export async function verifyPasswordRecoveryOTP(
  data: unknown,
): Promise<PasswordRecoveryResult> {
  try {
    const { mcUsername, otpCode } = stepTwoSchema.parse(data);

    const otpRecord = await db.registrationOTP.findUnique({
      where: { mcUsername },
    });

    if (!otpRecord) {
      return {
        success: false,
        error:
          "No verification code found for this username. Please start the password recovery process again.",
      };
    }

    if (isOTPExpired(otpRecord.expiresAt)) {
      await db.registrationOTP.delete({
        where: { mcUsername },
      });
      return {
        success: false,
        error:
          "Verification code has expired. Please start the password recovery process again.",
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
        "Verification code confirmed! Now set your new password to complete recovery.",
    };
  } catch (err) {
    console.error("Password recovery OTP verification error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Step 3: Complete password recovery with new password
 */
export async function completePasswordRecovery(
  data: unknown,
): Promise<PasswordRecoveryResult> {
  try {
    const { mcUsername, password } = completePasswordRecoverySchema.parse(data);

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
          "Verification code not found or expired. Please start the password recovery process again.",
      };
    }

    const existingUser = await db.user.findUnique({
      where: { mcUsername },
    });

    if (!existingUser) {
      await db.registrationOTP.delete({
        where: { mcUsername },
      });
      return {
        success: false,
        error:
          "User account not found. Please check your username or register a new account.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { mcUsername },
      data: { password: hashedPassword },
    });

    await db.registrationOTP.delete({
      where: { mcUsername },
    });

    await sendMessageToPlayer({
      playerName: mcUsername,
      message:
        "§a[MC-Shop] §fPassword recovery completed successfully! You can now log in with your new password.",
    });

    return {
      success: true,
      step: "completed",
      message:
        "Password recovery completed successfully! You can now log in with your new password.",
    };
  } catch (error) {
    console.error("Password recovery completion error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
