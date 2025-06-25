import { z } from "zod";

// Registration step schemas
export const stepOneSchema = z.object({
  mcUsername: z
    .string()
    .min(3, "Minecraft username must be at least 3 characters")
    .max(16, "Minecraft username must be at most 16 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
});

export const stepTwoSchema = z.object({
  mcUsername: z.string().min(1),
  otpCode: z
    .string()
    .length(6, "OTP code must be 6 digits")
    .regex(/^\d+$/, "OTP code must contain only numbers"),
});

export const stepThreeSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const completeRegistrationSchema = z
  .object({
    mcUsername: z.string().min(1),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  mcUsername: z.string().min(1, "Minecraft username is required"),
  password: z.string().min(1, "Password is required"),
});

// Type exports
export type StepOneData = z.infer<typeof stepOneSchema>;
export type StepTwoData = z.infer<typeof stepTwoSchema>;
export type StepThreeData = z.infer<typeof stepThreeSchema>;
export type CompleteRegistrationData = z.infer<
  typeof completeRegistrationSchema
>;
export type LoginData = z.infer<typeof loginSchema>;
