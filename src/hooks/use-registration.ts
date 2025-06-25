"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
        toast.success(result.message);
        setCurrentStep(2);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Registration step 1 error:", error);
      toast.error("An unexpected error occurred. Please try again.");
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
        toast.success(result.message);
        setCurrentStep(3);
      } else {
        toast.error(result.error);
        updateRegistrationData({ otpCode: "" });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An unexpected error occurred. Please try again.");
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
        toast.success(result.message);
        setCurrentStep(4);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 9000);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Registration completion error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      const result = await startRegistration({
        mcUsername: registrationData.mcUsername,
      });
      if (result.success) {
        toast.success("New verification code sent! Check your Minecraft chat.");
        updateRegistrationData({ otpCode: "" });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    updateRegistrationData({ otpCode: "" });
    setCurrentStep(1);
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
