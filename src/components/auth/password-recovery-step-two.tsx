"use client";

import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";

interface PasswordRecoveryStepTwoProps {
  mcUsername: string;
  otpCode: string;
  onOTPChange: (value: string) => void;
  onOTPComplete: (otpCode: string) => void;
  onResendCode: () => void;
  onGoBack: () => void;
  isLoading: boolean;
}

export function PasswordRecoveryStepTwo({
  mcUsername,
  otpCode,
  onOTPChange,
  onOTPComplete,
  onResendCode,
  onGoBack,
  isLoading,
}: PasswordRecoveryStepTwoProps) {
  const t = useTranslations("page.password-recovery.stepTwo");

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {t("verificationCode")}
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
          {t("helpDescription", { mcUsername })}
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
          {isLoading ? t("loading") : t("resendCode")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onGoBack}
          disabled={isLoading}
        >
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
