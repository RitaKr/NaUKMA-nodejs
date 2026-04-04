import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";

const service = new UserService();

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.list());
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.get(req.params.id));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    res.json(await service.get(userId));
  } catch (error) {
    next(error);
  }
};
