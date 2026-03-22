import { Router } from "express";
import { getMe, getUser, listUsers } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

router.get("/me", authenticate, getMe);
router.get("/", authenticate, requireAdmin, listUsers);
router.get("/:id", authenticate, requireAdmin, getUser);

export default router;
