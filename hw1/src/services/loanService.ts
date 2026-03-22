import prisma from "../db/client";
import { HttpError } from "./errors";
import { Loan } from "../types/loan";

const mapLoan = (l: {
  id: string;
  userId: string;
  bookId: string;
  loanDate: Date;
  returnDate: Date | null;
  status: string;
}): Loan => ({
  id: l.id,
  userId: l.userId,
  bookId: l.bookId,
  loanDate: l.loanDate,
  returnDate: l.returnDate,
  status: l.status as Loan["status"]
});

export class LoanService {
  async list(userId?: string, role?: string): Promise<Loan[]> {
    const where = role === "ADMIN" ? {} : { userId: userId ?? "" };
    const loans = await prisma.loan.findMany({ where });
    return loans.map(mapLoan);
  }

  async create(input: { userId: string; bookId: string }): Promise<Loan> {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const book = await prisma.book.findUnique({ where: { id: input.bookId } });
    if (!book) {
      throw new HttpError(404, "Book not found");
    }

    if (!book.available) {
      throw new HttpError(400, "Book is not available");
    }

    const activeLoan = await prisma.loan.findFirst({
      where: { bookId: input.bookId, status: "ACTIVE" }
    });
    if (activeLoan) {
      throw new HttpError(400, "Book already has an active loan");
    }

    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          userId: input.userId,
          bookId: input.bookId,
          status: "ACTIVE"
        }
      }),
      prisma.book.update({
        where: { id: input.bookId },
        data: { available: false }
      })
    ]);

    return mapLoan(loan);
  }

  async returnLoan(id: string): Promise<Loan> {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      throw new HttpError(404, "Loan not found");
    }

    if (loan.status === "RETURNED") {
      throw new HttpError(400, "Loan already returned");
    }

    const [updated] = await prisma.$transaction([
      prisma.loan.update({
        where: { id },
        data: { status: "RETURNED", returnDate: new Date() }
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: true }
      })
    ]);

    return mapLoan(updated);
  }
}
