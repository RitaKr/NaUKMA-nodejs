import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/client";
import { HttpError } from "./errors";
import { SafeUser } from "../types/user";
import { sendMail } from "../utils/sendMail";

const JWT_SECRET = process.env.JWT_SECRET ?? "jwt-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

const toSafeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string | null;
  avatarUrl: string | null;
}): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as SafeUser["role"],
  avatarUrl: user.avatarUrl ?? null
});

export class AuthService {
  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: SafeUser }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (existing) {
      throw new HttpError(400, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "USER"
      }
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return { token, user: toSafeUser(user) };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: SafeUser }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const valid = user.passwordHash
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;
    if (!valid) {
      throw new HttpError(
        401,
        user.passwordHash
          ? "Invalid email or password"
          : "This account uses OAuth login (Google)"
      );
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return { token, user: toSafeUser(user) };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }
  }

  generateToken(user: SafeUser): { token: string; user: SafeUser } {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    return { token, user };
  }

  async findOrCreateOAuthUser(input: {
    email: string;
    name: string;
    oauthProvider: string;
    oauthId: string;
  }): Promise<SafeUser> {
    //try find by provider + id first
    let user = await prisma.user.findFirst({
      where: { oauthProvider: input.oauthProvider, oauthId: input.oauthId }
    });

    //fall back to email (links existing account)
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: input.email } });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: null,
          role: "USER",
          oauthProvider: input.oauthProvider,
          oauthId: input.oauthId
        }
      });
    }

    return toSafeUser(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    //do not reveal if email is registered
    if (!user) return;

    const resetPayload = { email, purpose: "password-reset" };
    const resetToken = jwt.sign(resetPayload, JWT_SECRET, { expiresIn: "15m" } as jwt.SignOptions);

    const resetLink = `${process.env.BASE_URL ?? "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    await sendMail({
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click the link below to set a new password (valid for 15 minutes):</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>If you did not request this, please ignore this email.</p>`
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { email: string; purpose: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { email: string; purpose: string };
    } catch {
      throw new HttpError(400, "Invalid or expired reset token");
    }

    if (payload.purpose !== "password-reset") {
      throw new HttpError(400, "Invalid reset token");
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      throw new HttpError(400, "Invalid reset token");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });
  }
}
