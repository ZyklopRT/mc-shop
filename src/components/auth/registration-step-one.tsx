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
import { stepOneSchema, type StepOneData } from "~/lib/validations/auth";

interface RegistrationStepOneProps {
  onSubmit: (mcUsername: string) => void;
  isLoading: boolean;
  defaultValue?: string;
}

export function RegistrationStepOne({
  onSubmit,
  isLoading,
  defaultValue = "",
}: RegistrationStepOneProps) {
  const form = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: { mcUsername: defaultValue },
  });

  const handleSubmit = (data: StepOneData) => {
    onSubmit(data.mcUsername);
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
}
