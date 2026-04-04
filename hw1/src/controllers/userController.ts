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

export const uploadAvatarHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const userId = req.user!.userId;
    const user = await service.updateAvatar(userId, req.file.path);
    res.json({ message: "Avatar updated successfully.", avatarUrl: user.avatarUrl });
  } catch (error) {
    next(error);
  }
};

export const deleteAvatarHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await service.deleteAvatar(userId);
    res.json({ message: "Avatar deleted successfully." });
  } catch (error) {
    next(error);
  }
};
