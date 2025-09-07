import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().min(1).email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const verificationSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "6桁の数字を入力してください"),
});

export type VerificationFormData = z.infer<typeof verificationSchema>;

export const profileSchema = z.object({
  name: z.string().min(1).max(50),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const waitlistSchema = z.object({
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;
