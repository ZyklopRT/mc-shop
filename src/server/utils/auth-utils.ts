import { auth } from "~/server/auth";
import { db } from "~/server/db";

// Helper function to generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to format OTP message for Minecraft using tellraw
export function formatOTPTellrawCommand(
  playerName: string,
  otpCode: string,
): string {
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

// Helper function to check if OTP is expired
export function isOTPExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

// Helper function to create OTP expiration date (10 minutes from now)
export function createOTPExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/**
 * Check if the current user is authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  return session.user;
}

/**
 * Check if the current user is an admin
 */
export async function requireAdmin() {
  const user = await requireAuth();

  // Fetch fresh user data to get admin status
  const userData = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  if (!userData?.isAdmin) {
    throw new Error("Admin privileges required");
  }

  return user;
}

/**
 * Check if a user is admin (for use in components)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const userData = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return userData?.isAdmin ?? false;
}
