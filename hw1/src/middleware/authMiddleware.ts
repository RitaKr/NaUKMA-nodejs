import { Request, Response, NextFunction } from "express";
import { AuthService, JwtPayload } from "../services/authService";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const authService = new AuthService();

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
