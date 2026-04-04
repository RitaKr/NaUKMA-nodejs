import { prisma } from "../db/client";

export async function getEventStats() {
  const now = new Date();

  const [totalEvents, upcomingEvents, pastEvents, popularEvents] =
    await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { date: { gt: now } } }),
      prisma.event.count({ where: { date: { lte: now } } }),
      prisma.event.findMany({
        take: 5,
        orderBy: { bookings: { _count: "desc" } },
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          category: true,
          capacity: true,
          availableSeats: true,
          _count: { select: { bookings: true } },
        },
      }),
    ]);

  return {
    totalEvents,
    upcomingEvents,
    pastEvents,
    popularEvents: popularEvents.map((e: (typeof popularEvents)[number]) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      category: e.category,
      capacity: e.capacity,
      availableSeats: e.availableSeats,
      totalBookings: e._count.bookings,
    })),
  };
}

export async function getBookingStats() {
  const [totalBookings, activeBookings, cancelledBookings, revenueAgg, seatsAgg] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.aggregate({
        where: { status: "ACTIVE" },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: "ACTIVE" },
        _sum: { quantity: true },
      }),
    ]);

  return {
    totalBookings,
    activeBookings,
    cancelledBookings,
    totalRevenue: revenueAgg._sum.totalPrice ?? 0,
    totalSeatsSold: seatsAgg._sum.quantity ?? 0,
  };
}
