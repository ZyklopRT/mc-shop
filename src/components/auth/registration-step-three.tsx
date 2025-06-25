"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { stepThreeSchema, type StepThreeData } from "~/lib/validations/auth";

interface RegistrationStepThreeProps {
  onSubmit: (password: string, confirmPassword: string) => void;
  isLoading: boolean;
  defaultValues?: {
    password: string;
    confirmPassword: string;
  };
}

export function RegistrationStepThree({
  onSubmit,
  isLoading,
  defaultValues = { password: "", confirmPassword: "" },
}: RegistrationStepThreeProps) {
  const form = useForm<StepThreeData>({
    resolver: zodResolver(stepThreeSchema),
    defaultValues,
  });

  const handleSubmit = (data: StepThreeData) => {
    onSubmit(data.password, data.confirmPassword);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-4"
        >
          <FormField
            control={form.control}
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
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
}
