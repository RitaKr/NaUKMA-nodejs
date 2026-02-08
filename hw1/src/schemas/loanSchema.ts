import { z } from "zod";

export const loanCreateSchema = z.object({
  userId: z.string().min(1),
  bookId: z.string().min(1)
});
