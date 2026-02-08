import { randomUUID } from "crypto";
import { books, loans } from "../storage/memory";
import { saveBooks } from "../storage/fileStore";
import { Book } from "../types/book";
import { HttpError } from "./errors";

export class BookService {
  list(): Book[] {
    return Array.from(books.values());
  }

  get(id: string): Book {
    const book = books.get(id);
    if (!book) {
      throw new HttpError(404, "Book not found");
    }
    return book;
  }

  create(input: Omit<Book, "id">): Book {
    const id = randomUUID();
    const available = input.available ?? true;

    const existingIsbn = Array.from(books.values()).find(
      (book) => book.isbn === input.isbn
    );
    if (existingIsbn) {
      throw new HttpError(400, "ISBN already exists");
    }

    const book: Book = {
      id,
      title: input.title,
      author: input.author,
      year: input.year,
      isbn: input.isbn,
      available
    };
    books.set(id, book);
    saveBooks();
    return book;
  }

  update(id: string, input: Partial<Omit<Book, "id">>): Book {
    const book = this.get(id);

    if (input.isbn && input.isbn !== book.isbn) {
      const existingIsbn = Array.from(books.values()).find(
        (item) => item.isbn === input.isbn
      );
      if (existingIsbn) {
        throw new HttpError(400, "ISBN already exists");
      }
    }

    const updated: Book = {
      ...book,
      ...input
    };
    books.set(id, updated);
    saveBooks();
    return updated;
  }

  delete(id: string): void {
    const book = this.get(id);

    const hasActiveLoan = Array.from(loans.values()).some(
      (loan) => loan.bookId === id && loan.status === "ACTIVE"
    );
    if (hasActiveLoan) {
      throw new HttpError(400, "Book has an active loan");
    }

    books.delete(book.id);
   saveBooks();
  }
}
