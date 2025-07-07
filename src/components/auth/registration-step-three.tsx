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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("page.sign-up.stepThree");

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
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("passwordPlaceholder")}
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
                <FormLabel>{t("confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
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
