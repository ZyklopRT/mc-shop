"use client";

import { usePasswordRecovery } from "~/hooks/use-password-recovery";
import { PasswordRecoveryStepOne } from "~/components/auth/password-recovery-step-one";
import { PasswordRecoveryStepTwo } from "~/components/auth/password-recovery-step-two";
import { PasswordRecoveryStepThree } from "~/components/auth/password-recovery-step-three";
import { PasswordRecoveryStepFour } from "~/components/auth/password-recovery-step-four";
import { Progress } from "~/components/ui/progress";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { useTranslations } from "next-intl";
import type { StepConfig } from "~/lib/types/auth";

export default function PasswordRecoveryPage() {
  const t = useTranslations("page.password-recovery");

  const {
    currentStep,
    isLoading,
    recoveryData,
    updateRecoveryData,
    handleStepOne,
    handleOTPComplete,
    handleStepThree,
    handleResendCode,
    goBack,
    goToLogin,
  } = usePasswordRecovery();

  const RECOVERY_STEPS: readonly StepConfig[] = [
    {
      id: 1,
      title: t("stepOne.title"),
      description: t("stepOne.description"),
    },
    {
      id: 2,
      title: t("stepTwo.title"),
      description: t("stepTwo.description"),
    },
    {
      id: 3,
      title: t("stepThree.title"),
      description: t("stepThree.description"),
    },
    {
      id: 4,
      title: t("stepFour.title"),
      description: t("stepFour.description"),
    },
  ] as const;

  const currentStepData = RECOVERY_STEPS[currentStep - 1];
  const progressValue = (currentStep / RECOVERY_STEPS.length) * 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PasswordRecoveryStepOne
            onSubmit={handleStepOne}
            isLoading={isLoading}
            defaultValue={recoveryData.mcUsername}
          />
        );
      case 2:
        return (
          <PasswordRecoveryStepTwo
            mcUsername={recoveryData.mcUsername}
            otpCode={recoveryData.otpCode}
            onOTPChange={(value: string) =>
              updateRecoveryData({ otpCode: value })
            }
            onOTPComplete={handleOTPComplete}
            onResendCode={handleResendCode}
            onGoBack={goBack}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <PasswordRecoveryStepThree
            onSubmit={handleStepThree}
            isLoading={isLoading}
            defaultValues={{
              password: recoveryData.password,
              confirmPassword: recoveryData.confirmPassword,
            }}
          />
        );
      case 4:
        return (
          <PasswordRecoveryStepFour
            mcUsername={recoveryData.mcUsername}
            onGoToLogin={goToLogin}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <PageWrapper className="flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("description")}
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-8 shadow-xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress
                  value={progressValue}
                  className="h-2"
                  aria-label={`${t("progress")}: ${Math.round(progressValue)}%`}
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>
                    {t("step")} {currentStep} {t("of")} {RECOVERY_STEPS.length}
                  </span>
                  <span>
                    {Math.round(progressValue)}% {t("complete")}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-foreground text-xl font-semibold">
                  {currentStepData?.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {currentStepData?.description}
                </p>
              </div>

              {renderCurrentStep()}
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
