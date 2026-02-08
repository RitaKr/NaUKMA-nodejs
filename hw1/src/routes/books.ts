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

const router = Router();

router.get("/", listBooks);
router.get("/:id", getBook);
router.post("/", validateBody(bookCreateSchema), createBook);
router.put("/:id", validateBody(bookUpdateSchema), updateBook);
router.delete("/:id", deleteBook);

export default router;
