import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";

const service = new UserService();

export const listUsers = (req: Request, res: Response) => {
  res.json(service.list());
};

export const getUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(service.get(req.params.id));
  } catch (error) {
    next(error);
  }
};

export const createUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(service.create(req.body));
  } catch (error) {
    next(error);
  }
};
