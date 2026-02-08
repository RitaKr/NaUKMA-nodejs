import { Router } from "express";
import { createLoan, listLoans, returnLoan } from "../controllers/loanController";
import { validateBody } from "../middleware/validate";
import { loanCreateSchema } from "../schemas/loanSchema";

const router = Router();

router.get("/", listLoans);
router.post("/", validateBody(loanCreateSchema), createLoan);
router.post("/:id/return", returnLoan);

export default router;
