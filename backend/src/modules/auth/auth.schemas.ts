import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required.").max(100);
const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
const passwordSchema = z.string().min(8, "Password must contain at least 8 characters.").max(128);

export const registrationSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required.").max(128),
  })
  .strict();

export type RegistrationInput = z.output<typeof registrationSchema>;
export type LoginInput = z.output<typeof loginSchema>;
