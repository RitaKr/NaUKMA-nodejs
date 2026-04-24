import path from "path";
import fs from "fs";
import { prisma } from "../db/client";
import { HttpError } from "../utils/errors";
import {
    CreateEventInput,
    UpdateEventInput,
    EventQueryInput,
} from "../schemas/event.schema";

const eventInclude = {
  ticketCategories: {
    select: { id: true, name: true, price: true, totalSeats: true, availableSeats: true },
  },
  lineup: {
    select: { id: true, name: true, role: true },
  },
} as const;

export async function getEvents(query: EventQueryInput) {
  const { category, country, city, arena, date, sortBy, order, page, limit } = query;

  const andConditions: object[] = [{ deletedAt: null }];

  if (category) andConditions.push({ category: { contains: category } });
  if (country) andConditions.push({ country: { contains: country } });
  if (city) andConditions.push({ city: { contains: city } });
  if (arena) andConditions.push({ arena: { contains: arena } });

  if (date) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);
    andConditions.push({ date: { gte: dayStart, lte: dayEnd } });
  }

  const where = { AND: andConditions };
  const orderBy = sortBy ? { [sortBy]: order as "asc" | "desc" } : { date: "asc" as const };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: eventInclude,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEventById(id: string) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...eventInclude,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!event) throw new HttpError(404, "Event not found");
  return event;
}

export async function createEvent(data: CreateEventInput, createdById: string) {
  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      country: data.country,
      city: data.city,
      arena: data.arena,
      address: data.address,
      maxTicketsPerPerson: data.maxTicketsPerPerson,
      category: data.category,
      createdById,
      ticketCategories: {
        create: data.ticketCategories.map((tc) => ({
          name: tc.name,
          price: tc.price,
          totalSeats: tc.totalSeats,
          availableSeats: tc.totalSeats,
        })),
      },
      lineup: {
        create: data.lineup.map((l) => ({ name: l.name, role: l.role })),
      },
    },
    include: eventInclude,
  });
}

export async function updateEvent(id: string, data: UpdateEventInput) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw new HttpError(404, "Event not found");

  const updateData: {
    title?: string;
    description?: string;
    date?: Date;
    country?: string;
    city?: string;
    arena?: string;
    address?: string;
    maxTicketsPerPerson?: number;
    category?: string;
  } = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.country !== undefined) updateData.country = data.country;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.arena !== undefined) updateData.arena = data.arena;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.maxTicketsPerPerson !== undefined) updateData.maxTicketsPerPerson = data.maxTicketsPerPerson;
  if (data.category !== undefined) updateData.category = data.category;

  // Replace lineup if provided
  const lineupUpdate = data.lineup !== undefined
    ? {
        lineup: {
          deleteMany: {},
          create: data.lineup.map((l) => ({ name: l.name, role: l.role })),
        },
      }
    : {};

  return prisma.event.update({
    where: { id },
    data: { ...updateData, ...lineupUpdate },
    include: eventInclude,
  });
}

export async function softDeleteEvent(id: string) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw new HttpError(404, "Event not found");

  const activeBookingsCount = await prisma.booking.count({
    where: { eventId: id, status: "ACTIVE" },
  });
  if (activeBookingsCount > 0) {
    throw new HttpError(
      409,
      `Cannot delete event with ${activeBookingsCount} active booking(s). Cancel them first.`
    );
  }

  await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function updateEventImage(id: string, filename: string) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw new HttpError(404, "Event not found");

  if (event.imageUrl) {
    const oldPath = path.join(process.cwd(), event.imageUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const imageUrl = `/uploads/events/${filename}`;
  return prisma.event.update({
    where: { id },
    data: { imageUrl },
    include: eventInclude,
  });
}

export async function getEventBookings(eventId: string, page: number, limit: number) {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
  if (!event) throw new HttpError(404, "Event not found");

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tickets: { include: { ticketCategory: { select: { id: true, name: true, price: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { bookedAt: "desc" },
    }),
    prisma.booking.count({ where: { eventId } }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
}
