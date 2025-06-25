import { CheckCircle2, UserCheck, Shield, Key } from "lucide-react";
import type { StepConfig } from "~/lib/types/auth";

export const REGISTRATION_STEPS: readonly StepConfig[] = [
  {
    id: 1,
    title: "Enter Username",
    description: "Enter your Minecraft username to start",
    icon: UserCheck,
  },
  {
    id: 2,
    title: "Verify Account",
    description: "Check your Minecraft chat for verification code",
    icon: Shield,
  },
  {
    id: 3,
    title: "Set Password",
    description: "Create a secure password for your account",
    icon: Key,
  },
  {
    id: 4,
    title: "Complete",
    description: "Registration completed successfully!",
    icon: CheckCircle2,
  },
] as const;
