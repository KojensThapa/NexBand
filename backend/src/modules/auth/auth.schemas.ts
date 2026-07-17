// import { z } from "zod";

// const nameSchema = z.string().trim().min(1, "Name is required.").max(100);
// const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
// const passwordSchema = z.string().min(8, "Password must contain at least 8 characters.").max(128);

// export const registrationSchema = z
//   .object({
//     name: nameSchema,
//     email: emailSchema,
//     password: passwordSchema,
//   })
//   .strict();

// export const loginSchema = z
//   .object({
//     email: emailSchema,
//     password: z.string().min(1, "Password is required.").max(128),
//   })
//   .strict();

// export type RegistrationInput = z.output<typeof registrationSchema>;
// export type LoginInput = z.output<typeof loginSchema>;
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(5)
    .regex(/^[A-Za-z ]+$/, "Only letters and spaces are allowed"),

  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Invalid Password or Email"),
});

export type LoginInput = z.infer<typeof loginSchema>;