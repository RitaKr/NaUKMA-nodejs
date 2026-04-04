import prisma from "../db/client";
import { Book } from "../types/book";
import { HttpError } from "./errors";

export class BookService {
  async list(): Promise<Book[]> {
    return prisma.book.findMany();
  }

  async get(id: string): Promise<Book> {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      throw new HttpError(404, "Book not found");
    }
    return book;
  }

  async create(input: Omit<Book, "id">): Promise<Book> {
    const available = input.available ?? true;

    const existingIsbn = await prisma.book.findUnique({
      where: { isbn: input.isbn }
    });
    if (existingIsbn) {
      throw new HttpError(400, "ISBN already exists");
    }

    return prisma.book.create({
      data: {
        title: input.title,
        author: input.author,
        year: input.year,
        isbn: input.isbn,
        available
      }
    });
  }

  async update(id: string, input: Partial<Omit<Book, "id">>): Promise<Book> {
    const book = await this.get(id);

    if (input.isbn && input.isbn !== book.isbn) {
      const existingIsbn = await prisma.book.findUnique({
        where: { isbn: input.isbn }
      });
      if (existingIsbn) {
        throw new HttpError(400, "ISBN already exists");
      }
    }

    return prisma.book.update({
      where: { id },
      data: input
    });
  }

  async delete(id: string): Promise<void> {
    await this.get(id);

    const activeLoan = await prisma.loan.findFirst({
      where: { bookId: id, status: "ACTIVE" }
    });
    if (activeLoan) {
      throw new HttpError(400, "Book has an active loan");
    }

    await prisma.book.delete({ where: { id } });
  }
}
