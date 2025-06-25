"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { sendTellrawCommand, sendMessageToPlayer } from "./rcon-actions";

// Validation schemas
const registrationStepOneSchema = z.object({
  mcUsername: z
    .string()
    .min(3, "Minecraft username must be at least 3 characters")
    .max(16, "Minecraft username must be at most 16 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
});

const registrationStepTwoSchema = z.object({
  mcUsername: z.string().min(1),
  otpCode: z
    .string()
    .length(6, "OTP code must be 6 digits")
    .regex(/^\d+$/, "OTP code must contain only numbers"),
});

const registrationStepThreeSchema = z
  .object({
    mcUsername: z.string().min(1),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  mcUsername: z.string().min(1, "Minecraft username is required"),
  password: z.string().min(1, "Password is required"),
});

// Helper function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to format OTP message for Minecraft using tellraw
function formatOTPTellrawCommand(playerName: string, otpCode: string): string {
  const tellrawData = {
    text: "",
    extra: [
      { text: "[MC-Shop] ", color: "green", bold: true },
      { text: "Your verification code is: ", color: "white" },
      {
        text: otpCode,
        color: "yellow",
        bold: true,
        clickEvent: {
          action: "copy_to_clipboard",
          value: otpCode,
        },
        hoverEvent: {
          action: "show_text",
          value: "Click to copy OTP code",
        },
      },
      { text: ". This code expires in 10 minutes.", color: "white" },
    ],
  };

  return `tellraw ${playerName} ${JSON.stringify(tellrawData)}`;
}

export type RegistrationResult =
  | { success: false; error: string; step?: never }
  | {
      success: true;
      step: "otp-sent" | "otp-verified" | "completed";
      message: string;
    };

export type LoginResult =
  | { success: false; error: string }
  | { success: true; message: string };

/**
 * Step 1: Check if username is available and user is online, then send OTP
 */
export async function startRegistration(
  data: z.infer<typeof registrationStepOneSchema>,
): Promise<RegistrationResult> {
  try {
    const { mcUsername } = registrationStepOneSchema.parse(data);

    // Check if user already exists
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

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Try to send OTP via tellraw command to player via RCON
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

    // Delete any existing OTP for this username (upsert-like behavior)
    await db.registrationOTP.deleteMany({
      where: { mcUsername },
    });

    // Store new OTP in database
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
  } catch (error) {
    console.error("Registration step 1 error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Invalid input",
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Step 2: Verify OTP code
 */
export async function verifyOTP(
  data: z.infer<typeof registrationStepTwoSchema>,
): Promise<RegistrationResult> {
  try {
    const { mcUsername, otpCode } = registrationStepTwoSchema.parse(data);

    // Find the OTP record
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

    if (otpRecord.expiresAt < new Date()) {
      // Clean up expired OTP
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

    // Mark OTP as verified
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
  } catch (error) {
    console.error("OTP verification error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Invalid input",
      };
    }
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
  data: z.infer<typeof registrationStepThreeSchema>,
): Promise<RegistrationResult> {
  try {
    const { mcUsername, password } = registrationStepThreeSchema.parse(data);

    // Verify OTP was completed
    const otpRecord = await db.registrationOTP.findUnique({
      where: { mcUsername },
    });

    if (!otpRecord || !otpRecord.verified || otpRecord.expiresAt < new Date()) {
      return {
        success: false,
        error:
          "Verification code not found or expired. Please start the registration process again.",
      };
    }

    // Check if user was created in the meantime
    const existingUser = await db.user.findUnique({
      where: { mcUsername },
    });

    if (existingUser) {
      // Clean up OTP
      await db.registrationOTP.delete({
        where: { mcUsername },
      });
      return {
        success: false,
        error:
          "A user with this username already exists. Please try logging in instead.",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await db.user.create({
      data: {
        mcUsername,
        password: hashedPassword,
        name: mcUsername, // Set name to username for display
      },
    });

    // Clean up OTP
    await db.registrationOTP.delete({
      where: { mcUsername },
    });

    // Send success message to player
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
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Invalid input",
      };
    }
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
