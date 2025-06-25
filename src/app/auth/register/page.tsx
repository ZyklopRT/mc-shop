"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { useRegistration } from "~/hooks/use-registration";
import { REGISTRATION_STEPS } from "~/lib/constants/registration-steps";
import { RegistrationStepOne } from "~/components/auth/registration-step-one";
import { RegistrationStepTwo } from "~/components/auth/registration-step-two";
import { RegistrationStepThree } from "~/components/auth/registration-step-three";
import { RegistrationStepFour } from "~/components/auth/registration-step-four";

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
  const progressPercentage = (currentStep / REGISTRATION_STEPS.length) * 100;

  const renderStepContent = () => {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Step {currentStep} of {REGISTRATION_STEPS.length}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Title and Description */}
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">
              {currentStepData?.title}
            </CardTitle>
            <CardDescription className="text-base">
              {currentStepData?.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          {renderStepContent()}

          {currentStep !== 4 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
