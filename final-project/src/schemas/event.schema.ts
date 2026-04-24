import { z } from "zod";

const ticketCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  price: z.number({ invalid_type_error: "Price must be a number" }).nonnegative("Price must be 0 or greater"),
  totalSeats: z
    .number({ invalid_type_error: "Total seats must be a number" })
    .int()
    .positive("Total seats must be greater than 0"),
});

const lineupEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z
    .string()
    .datetime({ message: "Date must be a valid ISO 8601 datetime string" })
    .refine((d) => new Date(d) > new Date(), {
      message: "Event date must be in the future",
    }),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  arena: z.string().min(1, "Arena/venue is required"),
  address: z.string().min(1, "Full address is required"),
  maxTicketsPerPerson: z
    .number({ invalid_type_error: "Max tickets per person must be a number" })
    .int()
    .positive()
    .optional()
    .default(6),
  category: z.string().min(1, "Category is required"),
  ticketCategories: z
    .array(ticketCategorySchema)
    .min(1, "At least one ticket category is required"),
  lineup: z.array(lineupEntrySchema).optional().default([]),
});

export const updateEventSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(10).optional(),
    date: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(), { message: "Event date must be in the future" })
      .optional(),
    country: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    arena: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    maxTicketsPerPerson: z.number().int().positive().optional(),
    category: z.string().min(1).optional(),
    lineup: z.array(lineupEntrySchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const eventQuerySchema = z.object({
  category: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  arena: z.string().optional(),
  date: z.string().optional(),
  sortBy: z.enum(["date"]).optional(),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
