import { z } from "zod";

export const bookCreateSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int().min(0),
  isbn: z.string().min(1),
  available: z.boolean().optional()
});

export const bookUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  year: z.number().int().min(0).optional(),
  isbn: z.string().min(1).optional(),
  available: z.boolean().optional()
});
