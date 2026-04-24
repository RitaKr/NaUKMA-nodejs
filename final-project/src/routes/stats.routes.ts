import { Router } from "express";
import { getEventStats, getBookingStats } from "../controllers/stats.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// GET /stats/events - ADMIN only
router.get("/events", authenticate, requireRole("ADMIN"), getEventStats);

// GET /stats/bookings - ADMIN only
router.get("/bookings", authenticate, requireRole("ADMIN"), getBookingStats);

export default router;
