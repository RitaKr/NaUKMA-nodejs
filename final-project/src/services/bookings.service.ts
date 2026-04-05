import { Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import { HttpError } from "../utils/errors";
import { CreateBookingInput } from "../schemas/booking.schema";
import { sendMail, buildBookingConfirmationHtml, buildCancellationHtml } from "../utils/sendMail";
import { generateBookingPdf } from "../utils/pdf";

const bookingInclude = {
  event: {
    select: {
      id: true, title: true, date: true, country: true, city: true,
      arena: true, address: true, category: true, imageUrl: true,
      ticketCategories: { select: { id: true, name: true, price: true } },
      lineup: { select: { name: true, role: true } },
    },
  },
  user: { select: { id: true, name: true, email: true } },
  tickets: {
    include: { ticketCategory: { select: { id: true, name: true, price: true } } },
  },
} as const;

export async function createBooking(data: CreateBookingInput, userId: string) {
  //load event
  const event = await prisma.event.findFirst({
    where: { id: data.eventId, deletedAt: null },
    include: {
      ticketCategories: true,
      lineup: true,
    },
  });
  if (!event) throw new HttpError(404, "Event not found");
  if (event.date <= new Date()) throw new HttpError(400, "Cannot book tickets for a past event");

  //validate each requested ticket category
  const totalQuantity = data.tickets.reduce((s, t) => s + t.quantity, 0);
  if (totalQuantity > event.maxTicketsPerPerson) {
    throw new HttpError(
      400,
      `Max ${event.maxTicketsPerPerson} ticket(s) per person. Requested: ${totalQuantity}`
    );
  }

  for (const req of data.tickets) {
    const cat = event.ticketCategories.find((c: { id: string; }) => c.id === req.ticketCategoryId);
    if (!cat) {
      throw new HttpError(404, `Ticket category ${req.ticketCategoryId} not found for this event`);
    }
    if (cat.availableSeats < req.quantity) {
      throw new HttpError(
        400,
        `Not enough seats in category "${cat.name}". Available: ${cat.availableSeats}, requested: ${req.quantity}`
      );
    }
  }

  //calculate total price
  let totalPrice = 0;
  for (const req of data.tickets) {
    const cat = event.ticketCategories.find((c: { id: string; }) => c.id === req.ticketCategoryId)!;
    totalPrice += cat.price * req.quantity;
  }

  //create booking + individual tickets + decrement seats in a transaction
  const ticketRows = data.tickets.flatMap((req) =>
    Array.from({ length: req.quantity }, () => ({ ticketCategoryId: req.ticketCategoryId }))
  );

  const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.booking.create({
      data: {
        userId,
        eventId: data.eventId,
        totalPrice,
        status: "ACTIVE",
        tickets: { create: ticketRows },
      },
      include: bookingInclude,
    });

    for (const req of data.tickets) {
      await tx.ticketCategory.update({
        where: { id: req.ticketCategoryId },
        data: { availableSeats: { decrement: req.quantity } },
      });
    }

    return created;
  });

  //generate pdf and send confirmation email (non-blocking)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (user) {
    const ticketInfos = booking.tickets.map((t: { id: any; ticketCategory: { name: any; price: any; }; }) => ({
      ticketId: t.id,
      categoryName: t.ticketCategory.name,
      price: t.ticketCategory.price,
    }));

    generateBookingPdf({
      bookingId: booking.id,
      bookedAt: booking.bookedAt,
      totalPrice: booking.totalPrice,
      userName: user.name,
      userEmail: user.email,
      status: booking.status,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        country: event.country,
        city: event.city,
        arena: event.arena,
        address: event.address,
        category: event.category,
        imageUrl: event.imageUrl,
        lineup: event.lineup,
      },
      tickets: ticketInfos,
    })
      .then((pdfBuffer) => {
        const html = buildBookingConfirmationHtml({
          userName: user.name,
          bookingId: booking.id,
          eventTitle: event.title,
          eventDate: event.date,
          country: event.country,
          city: event.city,
          arena: event.arena,
          totalPrice,
          ticketCount: ticketRows.length,
          imageUrl: event.imageUrl ?? undefined,
        });
        return sendMail({
          to: user.email,
          subject: `Booking Confirmed: ${event.title}`,
          html,
          attachments: [
            {
              filename: `ticket-${booking.id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      })
      .catch((err) => console.error("Failed to send confirmation email:", err));
  }

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
      include: bookingInclude,
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
    include: bookingInclude,
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
    include: { tickets: true },
  });

  if (!booking) throw new HttpError(404, "Booking not found");
  if (role !== "ADMIN" && booking.userId !== userId) {
    throw new HttpError(403, "Forbidden: you can only cancel your own bookings");
  }
  if (booking.status === "CANCELLED") {
    throw new HttpError(400, "Booking is already cancelled");
  }

  const event = await prisma.event.findUnique({ where: { id: booking.eventId } });
  if (event && event.date <= new Date()) {
    throw new HttpError(400, "Cannot cancel a booking for a past event");
  }

  // Count tickets per category for seat restoration
  const countByCategory: Record<string, number> = {};
  for (const t of booking.tickets) {
    countByCategory[t.ticketCategoryId] = (countByCategory[t.ticketCategoryId] ?? 0) + 1;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    for (const [catId, qty] of Object.entries(countByCategory)) {
      await tx.ticketCategory.update({
        where: { id: catId },
        data: { availableSeats: { increment: qty } },
      });
    }
  });

  // Fire-and-forget cancellation email
  const user = await prisma.user.findUnique({
    where: { id: booking.userId },
    select: { name: true, email: true },
  });
  if (user && event) {
    sendMail({
      to: user.email,
      subject: `Booking Cancelled: ${event.title}`,
      html: buildCancellationHtml({
        userName: user.name,
        bookingId: booking.id,
        eventTitle: event.title,
        eventDate: event.date,
        ticketCount: booking.tickets.length,
      }),
    }).catch((err) => console.error("Failed to send cancellation email:", err));
  }

  return { message: "Booking successfully cancelled." };
}

export async function getBookingForPdf(id: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { id: true, title: true, date: true, country: true, city: true, arena: true, address: true, category: true, imageUrl: true, lineup: true } },
      tickets: { include: { ticketCategory: true } },
    },
  });

  if (!booking) throw new HttpError(404, "Booking not found");
  if (role !== "ADMIN" && booking.userId !== userId) {
    throw new HttpError(403, "Forbidden: you can only access your own booking PDF");
  }

  return booking;
}
