import { Router } from "express";
import { createLoan, listLoans, returnLoan } from "../controllers/loanController";
import { validateBody } from "../middleware/validate";
import { loanCreateSchema } from "../schemas/loanSchema";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, listLoans);
router.post("/", authenticate, validateBody(loanCreateSchema), createLoan);
router.post("/:id/return", authenticate, returnLoan);

export default router;
