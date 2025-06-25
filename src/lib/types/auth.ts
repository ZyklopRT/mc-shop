import type { LucideIcon } from "lucide-react";

export type RegistrationStep = 1 | 2 | 3 | 4;

export interface RegistrationState {
  mcUsername: string;
  otpCode: string;
  password: string;
  confirmPassword: string;
}

export interface StepConfig {
  id: RegistrationStep;
  title: string;
  description: string;
  icon: LucideIcon;
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
