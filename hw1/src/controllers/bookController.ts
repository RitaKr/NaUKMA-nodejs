import { Request, Response, NextFunction } from "express";
import { BookService } from "../services/bookService";

const service = new BookService();

export const listBooks = (req: Request, res: Response) => {
  res.json(service.list());
};

export const getBook = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(service.get(req.params.id));
  } catch (error) {
    next(error);
  }
};

export const createBook = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(service.create(req.body));
  } catch (error) {
    next(error);
  }
};

export const updateBook = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(service.update(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
};

export const deleteBook = (req: Request, res: Response, next: NextFunction) => {
  try {
    service.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
