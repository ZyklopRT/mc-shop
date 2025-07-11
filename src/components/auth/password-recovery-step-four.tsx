"use client";

import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";

interface PasswordRecoveryStepFourProps {
  mcUsername: string;
  onGoToLogin: () => void;
}

export function PasswordRecoveryStepFour({
  mcUsername,
  onGoToLogin,
}: PasswordRecoveryStepFourProps) {
  const t = useTranslations("page.password-recovery.stepFour");

  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-muted-foreground max-w-sm">
          {t("description", { mcUsername })}
        </p>
      </div>
      <Button onClick={onGoToLogin} className="w-full">
        {t("backToLogin")}
      </Button>
    </div>
  );
}
