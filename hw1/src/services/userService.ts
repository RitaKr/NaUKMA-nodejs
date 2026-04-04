import fs from "fs";
import path from "path";
import prisma from "../db/client";
import { HttpError } from "./errors";
import { SafeUser } from "../types/user";

const selectSafeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true
} as const;

export class UserService {
  async list(): Promise<SafeUser[]> {
    return prisma.user.findMany({ select: selectSafeUser }) as Promise<SafeUser[]>;
  }

  async get(id: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: selectSafeUser
    });
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user as SafeUser;
  }

  async updateAvatar(userId: string, filePath: string): Promise<SafeUser> {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing?.avatarUrl) {
      const oldFile = path.join(process.cwd(), existing.avatarUrl);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
    }

    const avatarUrl = `/uploads/avatars/${path.basename(filePath)}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: selectSafeUser
    });
    return user as SafeUser;
  }

  async deleteAvatar(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.avatarUrl) {
      throw new HttpError(404, "No avatar to delete");
    }

    const filePath = path.join(process.cwd(), user.avatarUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null }
    });
  }
}
