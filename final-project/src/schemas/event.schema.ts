import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z
    .string()
    .datetime({ message: "Date must be a valid ISO 8601 datetime string" })
    .refine((d) => new Date(d) > new Date(), {
      message: "Event date must be in the future",
    }),
  location: z.string().min(1, "Location is required"),
  capacity: z
    .number({ invalid_type_error: "Capacity must be a number" })
    .int("Capacity must be an integer")
    .positive("Capacity must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .nonnegative("Price must be 0 or greater"),
});

export const updateEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional(),
    date: z
      .string()
      .datetime({ message: "Date must be a valid ISO 8601 datetime string" })
      .refine((d) => new Date(d) > new Date(), {
        message: "Event date must be in the future",
      })
      .optional(),
    location: z.string().min(1, "Location is required").optional(),
    capacity: z
      .number({ invalid_type_error: "Capacity must be a number" })
      .int("Capacity must be an integer")
      .positive("Capacity must be greater than 0")
      .optional(),
    category: z.string().min(1, "Category is required").optional(),
    price: z
      .number({ invalid_type_error: "Price must be a number" })
      .nonnegative("Price must be 0 or greater")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const eventQuerySchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["date", "price"]).optional(),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
