"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  UserCheck,
  Shield,
  Key,
  AlertCircle,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Progress } from "~/components/ui/progress";

import {
  startRegistration,
  verifyOTP,
  completeRegistration,
} from "~/server/actions/auth-actions";

// Step schemas
const stepOneSchema = z.object({
  mcUsername: z
    .string()
    .min(3, "Minecraft username must be at least 3 characters")
    .max(16, "Minecraft username must be at most 16 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
});

// Step 2 - OTP handled manually, no form schema needed

const stepThreeSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type StepOneData = z.infer<typeof stepOneSchema>;
// Step 2 data handled directly in RegistrationState
type StepThreeData = z.infer<typeof stepThreeSchema>;

type RegistrationStep = 1 | 2 | 3 | 4;

// Single state object for all registration data
interface RegistrationState {
  mcUsername: string;
  otpCode: string;
  password: string;
  confirmPassword: string;
}

// Step configuration
const steps = [
  {
    id: 1,
    title: "Enter Username",
    description: "Enter your Minecraft username to start",
    icon: UserCheck,
  },
  {
    id: 2,
    title: "Verify Account",
    description: "Check your Minecraft chat for verification code",
    icon: Shield,
  },
  {
    id: 3,
    title: "Set Password",
    description: "Create a secure password for your account",
    icon: Key,
  },
  {
    id: 4,
    title: "Complete",
    description: "Registration completed successfully!",
    icon: CheckCircle2,
  },
] as const;

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationState>({
    mcUsername: "",
    otpCode: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();

  // Update registration data
  const updateRegistrationData = (updates: Partial<RegistrationState>) => {
    setRegistrationData((prev) => ({ ...prev, ...updates }));
  };

  // Step 1 form
  const stepOneForm = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: { mcUsername: registrationData.mcUsername },
  });

  // Step 2 - No form needed, handled manually

  // Step 3 form
  const stepThreeForm = useForm<StepThreeData>({
    resolver: zodResolver(stepThreeSchema),
    defaultValues: {
      password: registrationData.password,
      confirmPassword: registrationData.confirmPassword,
    },
  });

  const handleStepOne = async (data: StepOneData) => {
    setIsLoading(true);

    try {
      const result = await startRegistration(data);

      if (result.success) {
        updateRegistrationData({ mcUsername: data.mcUsername, otpCode: "" });
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

  const handleStepThree = async (data: StepThreeData) => {
    setIsLoading(true);
    updateRegistrationData({
      password: data.password,
      confirmPassword: data.confirmPassword,
    });

    try {
      const result = await completeRegistration({
        mcUsername: registrationData.mcUsername,
        password: data.password,
        confirmPassword: data.confirmPassword,
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

  const currentStepData = steps[currentStep - 1];
  const progressPercentage = (currentStep / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col items-center space-y-6">
            <Form {...stepOneForm}>
              <form
                onSubmit={stepOneForm.handleSubmit(handleStepOne)}
                className="w-full space-y-4"
              >
                <FormField
                  control={stepOneForm.control}
                  name="mcUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minecraft Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your Minecraft username"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Checking..." : "Continue"}
                </Button>
              </form>
            </Form>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Verification Code
              </label>
              <InputOTP
                maxLength={6}
                value={registrationData.otpCode}
                onChange={(value) => {
                  updateRegistrationData({ otpCode: value });
                }}
                onComplete={handleOTPComplete}
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
                Enter the 6-digit code sent to {registrationData.mcUsername} in
                Minecraft chat.
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  updateRegistrationData({ otpCode: "" });
                  setCurrentStep(1);
                }}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center space-y-6">
            <Form {...stepThreeForm}>
              <form
                onSubmit={stepThreeForm.handleSubmit(handleStepThree)}
                className="w-full space-y-4"
              >
                <FormField
                  control={stepThreeForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            updateRegistrationData({
                              password: e.target.value,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stepThreeForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          {...field}
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            updateRegistrationData({
                              confirmPassword: e.target.value,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Complete Registration"}
                </Button>
              </form>
            </Form>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Registration Completed!</h3>
              <p className="max-w-sm text-gray-600">
                Welcome, {registrationData.mcUsername}! You will be redirected
                to the login page in a few seconds...
              </p>
            </div>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
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
                Step {currentStep} of {steps.length}
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
