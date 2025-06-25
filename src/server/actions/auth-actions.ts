"use server";

import { loginSchema } from "~/lib/validations/auth";
import type { LoginResult } from "~/lib/types/auth";

// Re-export registration functions from the dedicated module
export {
  startRegistration,
  verifyOTP,
  completeRegistration,
  cleanupExpiredOTPs,
} from "./registration-actions";

// Re-export types
export type { RegistrationResult } from "~/lib/types/auth";

/**
 * Login function - handles user authentication
 */
export async function login(data: unknown): Promise<LoginResult> {
  try {
    const { mcUsername, password } = loginSchema.parse(data);

    // TODO: Implement login logic
    // This would typically involve:
    // 1. Finding the user in the database
    // 2. Verifying the password hash
    // 3. Creating a session/JWT token

    return {
      success: false,
      error: "Login functionality not yet implemented",
    };
  } catch (err) {
    console.error("Login error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
