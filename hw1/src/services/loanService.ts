import { randomUUID } from "crypto";
import { books, loans, users } from "../storage/memory";
import { saveBooks, saveLoans } from "../storage/fileStore";
import { HttpError } from "./errors";
import { Loan } from "../types/loan";

export class LoanService {
  list(): Loan[] {
    return Array.from(loans.values());
  }

  create(input: { userId: string; bookId: string }): Loan {
    const user = users.get(input.userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const book = books.get(input.bookId);
    if (!book) {
      throw new HttpError(404, "Book not found");
    }

    if (!book.available) {
      throw new HttpError(400, "Book is not available");
    }

    const activeLoan = Array.from(loans.values()).find(
      (loan) => loan.bookId === input.bookId && loan.status === "ACTIVE"
    );
    if (activeLoan) {
      throw new HttpError(400, "Book already has an active loan");
    }

    const id = randomUUID();
    const loan: Loan = {
      id,
      userId: input.userId,
      bookId: input.bookId,
      loanDate: new Date(),
      returnDate: null,
      status: "ACTIVE"
    };

    loans.set(id, loan);
    books.set(book.id, { ...book, available: false });
    saveLoans();
    saveBooks();

    return loan;
  }

  returnLoan(id: string): Loan {
    const loan = loans.get(id);
    if (!loan) {
      throw new HttpError(404, "Loan not found");
    }

    if (loan.status === "RETURNED") {
      throw new HttpError(400, "Loan already returned");
    }

    const book = books.get(loan.bookId);
    if (!book) {
      throw new HttpError(404, "Book not found");
    }

    const updated: Loan = {
      ...loan,
      status: "RETURNED",
      returnDate: new Date()
    };

    loans.set(id, updated);
    books.set(book.id, { ...book, available: true });
    saveLoans();
    saveBooks();

    return updated;
  }
}
