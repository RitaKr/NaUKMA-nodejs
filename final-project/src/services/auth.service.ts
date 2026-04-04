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
  if (!user || !user.passwordHash) {
    // No passwordHash means the account was created via OAuth
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

export async function findOrCreateOAuthUser(input: {
  email: string;
  name: string;
  oauthProvider: string;
  oauthId: string;
}) {
  // Try to find by provider + id first
  let user = await prisma.user.findFirst({
    where: { oauthProvider: input.oauthProvider, oauthId: input.oauthId },
    select: userSelect,
  });

  // Fall back to email — links an existing email/password account
  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email: input.email },
      select: userSelect,
    });
    user = byEmail ?? null;
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: null,
        oauthProvider: input.oauthProvider,
        oauthId: input.oauthId,
      },
      select: userSelect,
    });
  }

  return user;
}

export function generateToken(user: { userId: string; email: string; role: string }) {
  const token = signToken({ userId: user.userId, email: user.email, role: user.role });
  return { token, user };
}
