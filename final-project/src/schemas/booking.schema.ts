import { z } from "zod";

export const createBookingSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  tickets: z
    .array(
      z.object({
        ticketCategoryId: z.string().min(1, "Ticket category ID is required"),
        quantity: z
          .number({ invalid_type_error: "Quantity must be a number" })
          .int()
          .min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one ticket must be requested"),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
