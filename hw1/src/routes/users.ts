import { Router, Request, Response, NextFunction } from "express";
import { getMe, getUser, listUsers, uploadAvatarHandler, deleteAvatarHandler } from "../controllers/userController";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";
import { uploadAvatar } from "../middleware/uploadMiddleware";

const router = Router();

router.get("/me", authenticate, getMe);
router.post(
  "/me/avatar",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    uploadAvatar(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadAvatarHandler
);
router.delete("/me/avatar", authenticate, deleteAvatarHandler);
router.get("/", authenticate, requireAdmin, listUsers);
router.get("/:id", authenticate, requireAdmin, getUser);

export default router;
