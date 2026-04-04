import prisma from "../db/client";
import { HttpError } from "./errors";
import { SafeUser } from "../types/user";

const selectSafeUser = {
  id: true,
  name: true,
  email: true,
  role: true
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
}
