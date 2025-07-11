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

export interface PasswordRecoveryState {
  mcUsername: string;
  otpCode: string;
  password: string;
  confirmPassword: string;
}

export type PasswordRecoveryStep = 1 | 2 | 3 | 4;

export interface PasswordRecoveryResult {
  success: boolean;
  error?: string;
  message?: string;
  step?: "otp-sent" | "otp-verified" | "completed";
}
