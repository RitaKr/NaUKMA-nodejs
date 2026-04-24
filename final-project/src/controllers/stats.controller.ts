import { Request, Response, NextFunction } from "express";
import * as statsService from "../services/stats.service";

export async function getEventStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await statsService.getEventStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getBookingStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await statsService.getBookingStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
