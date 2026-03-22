import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db/client";
import { HttpError } from "./errors";
import { SafeUser } from "../types/user";

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
  passwordHash: string;
}): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as SafeUser["role"]
});

export class AuthService {
  async register(input: {
    name: string;
    email: string;
    password: string;
    role?: "USER" | "ADMIN";
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
        role: input.role ?? "USER"
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

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Invalid email or password");
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
}
