"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";

interface RegistrationStepFourProps {
  mcUsername: string;
  onGoToLogin: () => void;
}

export function RegistrationStepFour({
  mcUsername,
  onGoToLogin,
}: RegistrationStepFourProps) {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Registration Completed!</h3>
        <p className="max-w-sm text-gray-600">
          Welcome, {mcUsername}! You will be redirected to the login page in a
          few seconds...
        </p>
      </div>
      <Button onClick={onGoToLogin} className="w-full">
        Go to Login
      </Button>
    </div>
  );
}
