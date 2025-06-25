"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "~/lib/utils/toast";
import type { RegistrationStep, RegistrationState } from "~/lib/types/auth";
import {
  startRegistration,
  verifyOTP,
  completeRegistration,
} from "~/server/actions/registration-actions";

export function useRegistration() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationState>({
    mcUsername: "",
    otpCode: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();

  const updateRegistrationData = (updates: Partial<RegistrationState>) => {
    setRegistrationData((prev) => ({ ...prev, ...updates }));
  };

  const handleStepOne = async (mcUsername: string) => {
    setIsLoading(true);

    try {
      const result = await startRegistration({ mcUsername });

      if (result.success) {
        updateRegistrationData({ mcUsername, otpCode: "" });
        toast.success(result.message, "Code sent to your Minecraft chat");
        setCurrentStep(2);
      } else {
        // Determine toast type based on error content
        const errorMsg = result.error;

        if (errorMsg.includes("not currently online")) {
          toast.error(
            "Player Offline",
            "You need to be online in Minecraft to register. Please join the server first.",
          );
        } else if (errorMsg.includes("already exists")) {
          toast.info(
            "Account Exists",
            "This username is already registered. Try logging in instead.",
          );
        } else if (errorMsg.includes("Unable to connect")) {
          toast.error(
            "Server Connection Failed",
            "Cannot connect to the Minecraft server. Please try again later.",
          );
        } else {
          toast.error("Registration Failed", errorMsg);
        }
      }
    } catch (error) {
      console.error("Registration step 1 error:", error);
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
    updateRegistrationData({ otpCode });

    try {
      const result = await verifyOTP({
        mcUsername: registrationData.mcUsername,
        otpCode,
      });

      if (result.success) {
        toast.success("Code Verified!", "You can now set your password");
        setCurrentStep(3);
      } else {
        const errorMsg = result.error;

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
            "Please start the registration process again.",
          );
        } else {
          toast.error("Verification Failed", errorMsg);
        }
        updateRegistrationData({ otpCode: "" });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        "Verification Error",
        "Something went wrong during verification. Please try again.",
      );
      updateRegistrationData({ otpCode: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepThree = async (password: string, confirmPassword: string) => {
    setIsLoading(true);
    updateRegistrationData({ password, confirmPassword });

    try {
      const result = await completeRegistration({
        mcUsername: registrationData.mcUsername,
        password,
        confirmPassword,
      });

      if (result.success) {
        toast.success(
          "Registration Complete!",
          "Welcome! You'll be redirected to login shortly.",
        );
        setCurrentStep(4);
        // Show info toast about redirect
        setTimeout(() => {
          toast.info("Redirecting...", "Taking you to the login page");
        }, 2000);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 9000);
      } else {
        const errorMsg = result.error;

        if (errorMsg.includes("expired")) {
          toast.warning(
            "Session Expired",
            "Your verification session has expired. Please start over.",
          );
        } else if (errorMsg.includes("already exists")) {
          toast.info(
            "Account Created",
            "This account was already created. Try logging in instead.",
          );
        } else {
          toast.error("Registration Failed", errorMsg);
        }
      }
    } catch (error) {
      console.error("Registration completion error:", error);
      toast.error(
        "Registration Error",
        "Failed to complete registration. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      // Show info toast for resending
      toast.info(
        "Resending Code...",
        "Sending a new verification code to your Minecraft chat",
      );

      const result = await startRegistration({
        mcUsername: registrationData.mcUsername,
      });

      if (result.success) {
        toast.success(
          "New Code Sent!",
          "Check your Minecraft chat for the new verification code",
        );
        updateRegistrationData({ otpCode: "" });
      } else {
        const errorMsg = result.error;

        if (errorMsg.includes("not currently online")) {
          toast.warning(
            "Player Offline",
            "You need to be online in Minecraft to receive the code.",
          );
        } else if (errorMsg.includes("Unable to connect")) {
          toast.error(
            "Server Error",
            "Cannot connect to the Minecraft server right now.",
          );
        } else {
          toast.error("Resend Failed", errorMsg);
        }
      }
    } catch (error) {
      toast.error(
        "Resend Error",
        "Failed to resend verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    updateRegistrationData({ otpCode: "" });
    setCurrentStep(1);
    toast.info("Returning to Start", "You can enter a different username");
  };

  const goToLogin = () => {
    router.push("/auth/login");
  };

  return {
    currentStep,
    isLoading,
    registrationData,
    updateRegistrationData,
    handleStepOne,
    handleOTPComplete,
    handleStepThree,
    handleResendCode,
    goBack,
    goToLogin,
  };
}
