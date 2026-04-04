import { prisma } from "../db/client";
import { HttpError } from "../utils/errors";
import { CreateBookingInput } from "../schemas/booking.schema";

export async function createBooking(data: CreateBookingInput, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new HttpError(404, "Event not found");

  if (event.date <= new Date()) {
    throw new HttpError(400, "Cannot book tickets for a past event");
  }

  if (event.availableSeats < data.quantity) {
    throw new HttpError(
      400,
      `Not enough available seats. Requested: ${data.quantity}, available: ${event.availableSeats}`
    );
  }

  const totalPrice = data.quantity * event.price;

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        userId,
        eventId: data.eventId,
        quantity: data.quantity,
        totalPrice,
        status: "ACTIVE",
      },
    }),
    prisma.event.update({
      where: { id: data.eventId },
      data: { availableSeats: { decrement: data.quantity } },
    }),
  ]);

  return booking;
}

export async function getBookings(
  userId: string,
  role: string,
  page: number,
  limit: number
) {
  const where = role === "ADMIN" ? {} : { userId };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        event: {
          select: { id: true, title: true, date: true, location: true, category: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { bookedAt: "desc" },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBookingById(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      event: {
        select: { id: true, title: true, date: true, location: true, category: true },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!booking) throw new HttpError(404, "Booking not found");

  if (role !== "ADMIN" && booking.userId !== userId) {
    throw new HttpError(403, "Forbidden: you can only view your own bookings");
  }

  return booking;
}

export async function cancelBooking(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!booking) throw new HttpError(404, "Booking not found");

  if (role !== "ADMIN" && booking.userId !== userId) {
    throw new HttpError(403, "Forbidden: you can only cancel your own bookings");
  }

  if (booking.status === "CANCELLED") {
    throw new HttpError(400, "Booking is already cancelled");
  }

  if (booking.event.date <= new Date()) {
    throw new HttpError(400, "Cannot cancel a booking for a past event");
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    prisma.event.update({
      where: { id: booking.eventId },
      data: { availableSeats: { increment: booking.quantity } },
    }),
  ]);

  return { message: "Booking successfully cancelled." };
}
