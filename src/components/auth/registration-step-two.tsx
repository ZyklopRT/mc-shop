"use client";

import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";

interface RegistrationStepTwoProps {
  mcUsername: string;
  otpCode: string;
  onOTPChange: (value: string) => void;
  onOTPComplete: (otpCode: string) => void;
  onResendCode: () => void;
  onGoBack: () => void;
  isLoading: boolean;
}

export function RegistrationStepTwo({
  mcUsername,
  otpCode,
  onOTPChange,
  onOTPComplete,
  onResendCode,
  onGoBack,
  isLoading,
}: RegistrationStepTwoProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Verification Code
        </label>
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={onOTPChange}
          onComplete={onOTPComplete}
          disabled={isLoading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-muted-foreground max-w-sm text-sm">
          Enter the 6-digit code sent to {mcUsername} in Minecraft chat.
        </p>
      </div>
      <div className="w-full space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onResendCode}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Resend Code"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onGoBack}
          disabled={isLoading}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
