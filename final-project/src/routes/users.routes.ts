import { Router } from "express";
import { getMe, getAllUsers, getUserById } from "../controllers/users.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// GET /users/me - authenticated user only
router.get("/me", authenticate, getMe);

// GET /users - ADMIN only
router.get("/", authenticate, requireRole("ADMIN"), getAllUsers);

// GET /users/:id - ADMIN only
router.get("/:id", authenticate, requireRole("ADMIN"), getUserById);

export default router;
