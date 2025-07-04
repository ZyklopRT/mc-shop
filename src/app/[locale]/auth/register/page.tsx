"use client";

import { useRegistration } from "~/hooks/use-registration";
import { RegistrationStepOne } from "~/components/auth/registration-step-one";
import { RegistrationStepTwo } from "~/components/auth/registration-step-two";
import { RegistrationStepThree } from "~/components/auth/registration-step-three";
import { RegistrationStepFour } from "~/components/auth/registration-step-four";
import { Progress } from "~/components/ui/progress";
import { PageWrapper } from "~/components/ui/page-wrapper";
import { REGISTRATION_STEPS } from "~/lib/constants/registration-steps";

export default function RegisterPage() {
  const {
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
  } = useRegistration();

  const currentStepData = REGISTRATION_STEPS[currentStep - 1];
  const progressValue = (currentStep / REGISTRATION_STEPS.length) * 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RegistrationStepOne
            onSubmit={handleStepOne}
            isLoading={isLoading}
            defaultValue={registrationData.mcUsername}
          />
        );
      case 2:
        return (
          <RegistrationStepTwo
            mcUsername={registrationData.mcUsername}
            otpCode={registrationData.otpCode}
            onOTPChange={(value) => updateRegistrationData({ otpCode: value })}
            onOTPComplete={handleOTPComplete}
            onResendCode={handleResendCode}
            onGoBack={goBack}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <RegistrationStepThree
            onSubmit={handleStepThree}
            isLoading={isLoading}
            defaultValues={{
              password: registrationData.password,
              confirmPassword: registrationData.confirmPassword,
            }}
          />
        );
      case 4:
        return (
          <RegistrationStepFour
            mcUsername={registrationData.mcUsername}
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
            <h1 className="text-foreground text-3xl font-bold">
              MC <span className="text-primary">Shop</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Create your account to get started
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-8 shadow-xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress
                  value={progressValue}
                  className="h-2"
                  aria-label={`Registration progress: ${Math.round(progressValue)}%`}
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>
                    Step {currentStep} of {REGISTRATION_STEPS.length}
                  </span>
                  <span>{Math.round(progressValue)}% complete</span>
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
