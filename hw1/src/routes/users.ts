import { Router } from "express";
import { createUser, getUser, listUsers } from "../controllers/userController";
import { validateBody } from "../middleware/validate";
import { userCreateSchema } from "../schemas/userSchema";

const router = Router();

router.get("/", listUsers);
router.post("/", validateBody(userCreateSchema), createUser);
router.get("/:id", getUser);

export default router;
