import type { StepConfig } from "~/lib/types/auth";

export const REGISTRATION_STEPS: readonly StepConfig[] = [
  {
    id: 1,
    title: "Enter Username",
    description: "Enter your Minecraft username to start",
  },
  {
    id: 2,
    title: "Verify Account",
    description: "Check your Minecraft chat for verification code",
  },
  {
    id: 3,
    title: "Set Password",
    description: "Create a secure password for your account",
  },
  {
    id: 4,
    title: "Complete",
    description: "Registration completed successfully!",
  },
] as const;
