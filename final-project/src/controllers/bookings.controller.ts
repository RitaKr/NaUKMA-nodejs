import { Request, Response, NextFunction } from "express";
import * as bookingsService from "../services/bookings.service";
import { bookingQuerySchema } from "../schemas/booking.schema";
import { generateBookingPdf } from "../utils/pdf";

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const booking = await bookingsService.createBooking(req.body, req.user!.userId);
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

export async function getBookingPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const booking = await bookingsService.getBookingForPdf(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );

    const ticketInfos = booking.tickets.map((t: { id: any; ticketCategory: { name: any; price: any; }; }) => ({
      ticketId: t.id,
      categoryName: t.ticketCategory.name,
      price: t.ticketCategory.price,
    }));

    const pdfBuffer = await generateBookingPdf({
      bookingId: booking.id,
      bookedAt: booking.bookedAt,
      totalPrice: booking.totalPrice,
      userName: booking.user.name,
      userEmail: booking.user.email,
      status: booking.status,
      event: {
        id: booking.event.id,
        title: booking.event.title,
        date: booking.event.date,
        country: booking.event.country,
        city: booking.event.city,
        arena: booking.event.arena,
        address: booking.event.address,
        category: booking.event.category,
        imageUrl: booking.event.imageUrl,
        lineup: booking.event.lineup,
      },
      tickets: ticketInfos,
    });

    res
      .type("pdf")
      .setHeader("Content-Disposition", `attachment; filename="ticket-${booking.id}.pdf"`)
      .send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
