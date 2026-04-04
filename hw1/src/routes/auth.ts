import { Router, Request, Response, NextFunction } from "express";
import { register, login, requestPasswordReset, resetPassword } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from "../schemas/authSchema";
import passport from "../config/passport";
import { AuthService } from "../services/authService";
import { SafeUser } from "../types/user";

const router = Router();
const authService = new AuthService();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/request-password-reset", validateBody(requestPasswordResetSchema), requestPasswordReset);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);

//Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get("/google/callback", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { session: false }, (err: Error | null, user: SafeUser | false) => {
    if (err || !user) {
      return res.status(401).json({ message: "Google authentication failed" });
    }
    res.json(authService.generateToken(user));
  })(req, res, next);
});

export default router;
