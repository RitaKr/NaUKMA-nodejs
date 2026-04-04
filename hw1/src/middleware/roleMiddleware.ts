import { Request, Response, NextFunction } from "express";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ message: "Forbidden: admin access required" });
    return;
  }
  next();
};
