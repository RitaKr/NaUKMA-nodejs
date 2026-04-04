import path from "path";
import fs from "fs";
import { prisma } from "../db/client";
import { HttpError } from "../utils/errors";
import {
    CreateEventInput,
    UpdateEventInput,
    EventQueryInput,
} from "../schemas/event.schema";

const eventSelect = {
  id: true,
  title: true,
  description: true,
  date: true,
  location: true,
  capacity: true,
  availableSeats: true,
  category: true,
  price: true,
  imageUrl: true,
  createdById: true,
  createdAt: true,
} as const;

export async function getEvents(query: EventQueryInput) {
  const { category, location, date, minPrice, maxPrice, sortBy, order, page, limit } =
    query;

  const andConditions: object[] = [{ deletedAt: null }];

  if (category) andConditions.push({ category: { contains: category } });
  if (location) andConditions.push({ location: { contains: location } });

  if (date) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);
    andConditions.push({ date: { gte: dayStart, lte: dayEnd } });
  }

  if (minPrice !== undefined) andConditions.push({ price: { gte: minPrice } });
  if (maxPrice !== undefined) andConditions.push({ price: { lte: maxPrice } });

  const where = { AND: andConditions };

  const orderBy = sortBy
    ? { [sortBy]: order as "asc" | "desc" }
    : { date: "asc" as const };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: eventSelect,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEventById(id: string) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
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
      location: data.location,
      capacity: data.capacity,
      availableSeats: data.capacity,
      category: data.category,
      price: data.price,
      createdById,
    },
    select: eventSelect,
  });
}

export async function updateEvent(id: string, data: UpdateEventInput) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw new HttpError(404, "Event not found");

  const updateData: {
    title?: string;
    description?: string;
    date?: Date;
    location?: string;
    category?: string;
    price?: number;
    capacity?: number;
    availableSeats?: number;
  } = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.location !== undefined) updateData.location = data.location;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.price !== undefined) updateData.price = data.price;

  if (data.capacity !== undefined) {
    const bookedSeats = event.capacity - event.availableSeats;
    const newAvailable = data.capacity - bookedSeats;
    if (newAvailable < 0) {
      throw new HttpError(
        400,
        `New capacity (${data.capacity}) is less than already booked seats (${bookedSeats})`
      );
    }
    updateData.capacity = data.capacity;
    updateData.availableSeats = newAvailable;
  }

  return prisma.event.update({ where: { id }, data: updateData, select: eventSelect });
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

  // Remove old image file from disk if present
  if (event.imageUrl) {
    const oldPath = path.join(process.cwd(), event.imageUrl);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const imageUrl = `/uploads/events/${filename}`;
  return prisma.event.update({
    where: { id },
    data: { imageUrl },
    select: eventSelect,
  });
}

export async function getEventBookings(
  eventId: string,
  page: number,
  limit: number
) {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
  if (!event) throw new HttpError(404, "Event not found");

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { bookedAt: "desc" },
    }),
    prisma.booking.count({ where: { eventId } }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
}
