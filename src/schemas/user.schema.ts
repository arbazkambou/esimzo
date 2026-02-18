import { z } from "zod";

// ─── Create User ─────────────────────────────────────────────────

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required").optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];

// ─── Update User ─────────────────────────────────────────────────

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    email: z.string().email("Invalid email address").optional(),
    name: z.string().min(1, "Name must not be empty").optional(),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];

// ─── Get / Delete User ──────────────────────────────────────────

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
