import { prisma } from "../db/client";
import { HttpError } from "../utils/errors";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

export async function getAllUsers(page: number, limit: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}
