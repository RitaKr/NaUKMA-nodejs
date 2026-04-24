import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";

const service = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await service.requestPasswordReset(req.body.email);
    res.json({ message: "If the provided email is registered, you will receive an email with instructions." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await service.resetPassword(req.body.token, req.body.password);
    res.json({ message: "Password has been successfully changed." });
  } catch (error) {
    next(error);
  }
};
