import { Request, Response, NextFunction } from "express";
import * as bookingsService from "../services/bookings.service";
import { bookingQuerySchema } from "../schemas/booking.schema";
import { generateBookingQR } from "../utils/qrcode";

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const booking = await bookingsService.createBooking(req.body, req.user!.userId, baseUrl);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function getBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = bookingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const result = await bookingsService.getBookings(
      req.user!.userId,
      req.user!.role,
      parsed.data.page,
      parsed.data.limit
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const booking = await bookingsService.getBookingById(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await bookingsService.cancelBooking(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBookingQR(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await bookingsService.getBookingForQR(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );
    const qrBuffer = await generateBookingQR(data);
    res.type("png").send(qrBuffer);
  } catch (err) {
    next(err);
  }
}
