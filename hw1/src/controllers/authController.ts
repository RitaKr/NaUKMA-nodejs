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
