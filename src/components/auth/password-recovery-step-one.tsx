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
import { useTranslations } from "next-intl";

interface PasswordRecoveryStepOneProps {
  onSubmit: (mcUsername: string) => void;
  isLoading: boolean;
  defaultValue?: string;
}

export function PasswordRecoveryStepOne({
  onSubmit,
  isLoading,
  defaultValue = "",
}: PasswordRecoveryStepOneProps) {
  const t = useTranslations("page.password-recovery.stepOne");

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
                <FormLabel>{t("mcUsername")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("mcUsernamePlaceholder")}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("loading") : t("continue")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
