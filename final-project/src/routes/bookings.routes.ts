import { Router } from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookings.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../schemas/booking.schema";

const router = Router();

// POST /bookings - authenticated
router.post("/", authenticate, validate(createBookingSchema), createBooking);

// GET /bookings - authenticated (ADMIN sees all, USER sees own)
router.get("/", authenticate, getBookings);

// GET /bookings/:id - authenticated
router.get("/:id", authenticate, getBookingById);

// POST /bookings/:id/cancel - authenticated
router.post("/:id/cancel", authenticate, cancelBooking);

export default router;
