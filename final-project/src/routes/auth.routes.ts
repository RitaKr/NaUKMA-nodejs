import { Router, Request, Response, NextFunction } from "express";
import { register, login } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import passport from "../config/passport";
import { generateToken } from "../services/auth.service";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), register);

// POST /auth/login
router.post("/login", validate(loginSchema), login);

// GET /auth/google — redirect to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /auth/google/callback — Google redirects here after consent
router.get("/google/callback", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: Error | null, user: Express.User | false) => {
      if (err) {
        console.error("[OAuth] Google callback error:", err.message);
        return res.status(401).json({ message: "Google authentication failed", detail: err.message });
      }
      if (!user) {
        console.error("[OAuth] No user returned from Google strategy");
        return res.status(401).json({ message: "Google authentication failed" });
      }
      res.json(generateToken(user));
    }
  )(req, res, next);
});

export default router;
