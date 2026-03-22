import { Request, Response, NextFunction } from "express";
import { BookService } from "../services/bookService";

const service = new BookService();

export const listBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.list());
  } catch (error) {
    next(error);
  }
};

export const getBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.get(req.params.id));
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await service.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
