import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/errors";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new HttpError(403, "Forbidden: insufficient permissions"));
      return;
    }
    next();
  };
}
