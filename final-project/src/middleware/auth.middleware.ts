import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/errors";

// Augment Express.User (used by @types/passport) so req.user carries our JWT fields
declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: string;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new HttpError(401, "Unauthorized: no token provided"));
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
