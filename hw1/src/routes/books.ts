import { Router } from "express";
import {
    createBook,
    deleteBook,
    getBook,
    listBooks,
    updateBook
} from "../controllers/bookController";
import { validateBody } from "../middleware/validate";
import { bookCreateSchema, bookUpdateSchema } from "../schemas/bookSchema";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

router.get("/", listBooks);
router.get("/:id", getBook);
router.post("/", authenticate, requireAdmin, validateBody(bookCreateSchema), createBook);
router.put("/:id", authenticate, requireAdmin, validateBody(bookUpdateSchema), updateBook);
router.delete("/:id", authenticate, requireAdmin, deleteBook);

export default router;
