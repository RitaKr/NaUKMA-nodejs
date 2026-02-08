import { Request, Response, NextFunction } from "express";
import { LoanService } from "../services/loanService";

const service = new LoanService();

export const listLoans = (req: Request, res: Response) => {
  res.json(service.list());
};

export const createLoan = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(service.create(req.body));
  } catch (error) {
    next(error);
  }
};

export const returnLoan = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(service.returnLoan(req.params.id));
  } catch (error) {
    next(error);
  }
};
