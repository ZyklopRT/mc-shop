"use client";

import { useState } from "react";
import { useRouter } from "~/lib/i18n/routing";
import { toast } from "~/lib/utils/toast";
import type {
  PasswordRecoveryStep,
  PasswordRecoveryState,
} from "~/lib/types/auth";
import {
  startPasswordRecovery,
  verifyPasswordRecoveryOTP,
  completePasswordRecovery,
} from "~/server/actions/password-recovery-actions";

export function usePasswordRecovery() {
  const [currentStep, setCurrentStep] = useState<PasswordRecoveryStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryData, setRecoveryData] = useState<PasswordRecoveryState>({
    mcUsername: "",
    otpCode: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();

  const updateRecoveryData = (updates: Partial<PasswordRecoveryState>) => {
    setRecoveryData((prev) => ({ ...prev, ...updates }));
  };

  const handleStepOne = async (mcUsername: string) => {
    setIsLoading(true);

    try {
      const result = await startPasswordRecovery({ mcUsername });

      if (result.success) {
        updateRecoveryData({ mcUsername, otpCode: "" });
        toast.success(
          result.message ?? "Success",
          "Code sent to your Minecraft chat",
        );
        setCurrentStep(2);
      } else {
        const errorMsg = result.error ?? "Unknown error occurred";

        if (errorMsg.includes("not currently online")) {
          toast.error(
            "Player Offline",
            "You need to be online in Minecraft to recover your password. Please join the server first.",
          );
        } else if (errorMsg.includes("No account found")) {
          toast.info(
            "Account Not Found",
            "No account exists with this username. Please check your username or register a new account.",
          );
        } else if (errorMsg.includes("Unable to connect")) {
          toast.error(
            "Server Connection Failed",
            "Cannot connect to the Minecraft server. Please try again later.",
          );
        } else {
          toast.error("Password Recovery Failed", errorMsg);
        }
      }
    } catch (error) {
      console.error("Password recovery step 1 error:", error);
      toast.error(
        "Unexpected Error",
        "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = async (otpCode: string) => {
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    updateRecoveryData({ otpCode });

    try {
      const result = await verifyPasswordRecoveryOTP({
        mcUsername: recoveryData.mcUsername,
        otpCode,
      });

      if (result.success) {
        toast.success("Code Verified!", "You can now set your new password");
        setCurrentStep(3);
      } else {
        const errorMsg = result.error ?? "Unknown error occurred";

        if (errorMsg.includes("expired")) {
          toast.warning(
            "Code Expired",
            "Your verification code has expired. Please request a new one.",
          );
        } else if (errorMsg.includes("Invalid verification code")) {
          toast.error(
            "Invalid Code",
            "The verification code is incorrect. Please try again.",
          );
        } else if (errorMsg.includes("No verification code found")) {
          toast.warning(
            "Code Not Found",
            "Please start the password recovery process again.",
          );
        } else {
          toast.error("Verification Failed", errorMsg);
        }
        updateRecoveryData({ otpCode: "" });
      }
    } catch (error) {
      console.error("Password recovery OTP verification error:", error);
      toast.error(
        "Verification Error",
        "Something went wrong during verification. Please try again.",
      );
      updateRecoveryData({ otpCode: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepThree = async (password: string, confirmPassword: string) => {
    setIsLoading(true);
    updateRecoveryData({ password, confirmPassword });

    try {
      const result = await completePasswordRecovery({
        mcUsername: recoveryData.mcUsername,
        password,
        confirmPassword,
      });

      if (result.success) {
        toast.success(
          "Password Recovery Complete!",
          "Your password has been reset successfully. You'll be redirected to login shortly.",
        );
        setCurrentStep(4);
        setTimeout(() => {
          toast.info("Redirecting...", "Taking you to the login page");
        }, 2000);
        setTimeout(() => {
          router.push("/auth/login");
        }, 4000);
      } else {
        const errorMsg = result.error ?? "Unknown error occurred";

        if (errorMsg.includes("expired")) {
          toast.warning(
            "Session Expired",
            "Your verification session has expired. Please start over.",
          );
        } else if (errorMsg.includes("User account not found")) {
          toast.error(
            "Account Not Found",
            "The user account could not be found. Please try again or register.",
          );
        } else {
          toast.error("Password Recovery Failed", errorMsg);
        }
      }
    } catch (error) {
      console.error("Password recovery completion error:", error);
      toast.error(
        "Recovery Error",
        "Failed to complete password recovery. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      toast.info(
        "Resending Code...",
        "Sending a new verification code to your Minecraft chat",
      );

      const result = await startPasswordRecovery({
        mcUsername: recoveryData.mcUsername,
      });

      if (result.success) {
        toast.success(
          "New Code Sent!",
          "Check your Minecraft chat for the new verification code",
        );
        updateRecoveryData({ otpCode: "" });
      } else {
        const errorMsg = result.error ?? "Unknown error occurred";

        if (errorMsg.includes("not currently online")) {
          toast.warning(
            "Player Offline",
            "Please join the server and try again.",
          );
        } else {
          toast.error("Resend Failed", errorMsg);
        }
      }
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("Resend Error", "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetRecovery = () => {
    setCurrentStep(1);
    setRecoveryData({
      mcUsername: "",
      otpCode: "",
      password: "",
      confirmPassword: "",
    });
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as PasswordRecoveryStep);
    }
  };

  const goToLogin = () => {
    router.push("/auth/login");
  };

  return {
    currentStep,
    isLoading,
    recoveryData,
    updateRecoveryData,
    handleStepOne,
    handleOTPComplete,
    handleStepThree,
    handleResendCode,
    resetRecovery,
    goBack,
    goToLogin,
  };
}
