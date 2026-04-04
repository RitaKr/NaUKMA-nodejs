import { Request, Response, NextFunction } from "express";
import * as eventsService from "../services/events.service";
import { eventQuerySchema } from "../schemas/event.schema";
import { bookingQuerySchema } from "../schemas/booking.schema";
import { HttpError } from "../utils/errors";

export async function getEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = eventQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const result = await eventsService.getEvents(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEventById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await eventsService.getEventById(req.params.id);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await eventsService.createEvent(req.body, req.user!.userId);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await eventsService.softDeleteEvent(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function uploadEventImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new HttpError(400, "No image file provided");
    }
    const event = await eventsService.updateEventImage(req.params.id, req.file.filename);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function getEventBookings(
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
    const result = await eventsService.getEventBookings(
      req.params.id,
      parsed.data.page,
      parsed.data.limit
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
