import { Router } from "express";
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventBookings,
    uploadEventImage,
} from "../controllers/events.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema";
import { uploadEventImage as uploadMiddleware } from "../middleware/upload.middleware";

const router = Router();

// GET /events - public
router.get("/", getEvents);

// GET /events/:id - public
router.get("/:id", getEventById);

// POST /events - ADMIN only
router.post("/", authenticate, requireRole("ADMIN"), validate(createEventSchema), createEvent);

// PUT /events/:id - ADMIN only
router.put("/:id", authenticate, requireRole("ADMIN"), validate(updateEventSchema), updateEvent);

// DELETE /events/:id - ADMIN only
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteEvent);

// GET /events/:id/bookings - ADMIN only
router.get("/:id/bookings", authenticate, requireRole("ADMIN"), getEventBookings);

// POST /events/:id/image - ADMIN only (multipart/form-data, field: image)
router.post("/:id/image", authenticate, requireRole("ADMIN"), uploadMiddleware, uploadEventImage);

export default router;
