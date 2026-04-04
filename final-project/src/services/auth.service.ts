import bcrypt from "bcryptjs";
import { prisma } from "../db/client";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/errors";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new HttpError(409, "Email is already in use");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
    select: userSelect,
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return { token, user };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { passwordHash: _omit, ...safeUser } = user;
  return { token, user: safeUser };
}
