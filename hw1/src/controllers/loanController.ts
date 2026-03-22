import { Request, Response, NextFunction } from "express";
import { LoanService } from "../services/loanService";

const service = new LoanService();

export const listLoans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.list(req.user?.userId, req.user?.role));
  } catch (error) {
    next(error);
  }
};

export const createLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (error) {
    next(error);
  }
};

export const returnLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await service.returnLoan(req.params.id));
  } catch (error) {
    next(error);
  }
};
