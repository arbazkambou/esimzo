import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";

// ─── GET /api/users ──────────────────────────────────────────────

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const response: ApiResponse = {
    success: true,
    data: users,
  };

  res.json(response);
});

// ─── GET /api/users/:id ─────────────────────────────────────────

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    } satisfies ApiResponse);
    return;
  }

  const response: ApiResponse = { success: true, data: user };
  res.json(response);
});

// ─── POST /api/users ─────────────────────────────────────────────

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body as CreateUserInput;

  const user = await prisma.user.create({
    data: { email, name },
  });

  const response: ApiResponse = { success: true, data: user };
  res.status(201).json(response);
});

// ─── PATCH /api/users/:id ────────────────────────────────────────

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body as UpdateUserInput;

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  const response: ApiResponse = { success: true, data: user };
  res.json(response);
});

// ─── DELETE /api/users/:id ───────────────────────────────────────

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  await prisma.user.delete({ where: { id } });

  const response: ApiResponse = {
    success: true,
    message: "User deleted successfully",
  };
  res.json(response);
});
