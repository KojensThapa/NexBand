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

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must contain at least 2 characters")
  .max(100, "Full name must not exceed 100 characters");

const emailSchema = z.string().trim().toLowerCase().email("Invalid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

const profileImageSchema = z
  .string()
  .max(2_800_000, "Profile image must be smaller than 2 MB")
  .regex(
    /^data:image\/(png|jpe?g|webp|gif);base64,/i,
    "Profile image must be a PNG, JPG, WEBP, or GIF data URL"
  );

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Email and password are required.").max(128),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    // Send null to explicitly remove a saved photo. Omitting image leaves it unchanged.
    image: profileImageSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.fullName !== undefined || value.image !== undefined, {
    message: "Provide a name or profile image to update.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
