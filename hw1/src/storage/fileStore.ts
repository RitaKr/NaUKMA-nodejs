import { promises as fs } from "fs";
import path from "path";
import { books, loans, users } from "./memory";
import { Book } from "../types/book";
import { Loan } from "../types/loan";
import { User } from "../types/user";

const dataDir = path.resolve(process.cwd(), "data");
const booksFile = path.join(dataDir, "books.json");
const usersFile = path.join(dataDir, "users.json");
const loansFile = path.join(dataDir, "loans.json");

type PersistedLoan = Omit<Loan, "loanDate" | "returnDate"> & {
  loanDate: string;
  returnDate: string | null;
};

const ensureDataDir = async () => {
  await fs.mkdir(dataDir, { recursive: true });
};

const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
};

const writeJson = async <T>(filePath: string, data: T): Promise<void> => {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};

export const loadAll = async (): Promise<void> => {
  const storedBooks = await readJson<Book[]>(booksFile, []);
  const storedUsers = await readJson<User[]>(usersFile, []);
  const storedLoans = await readJson<PersistedLoan[]>(loansFile, []);

  books.clear();
  users.clear();
  loans.clear();

  storedBooks.forEach((book) => books.set(book.id, book));
  storedUsers.forEach((user) => users.set(user.id, user));
  storedLoans.forEach((loan) => {
    loans.set(loan.id, {
      ...loan,
      loanDate: new Date(loan.loanDate),
      returnDate: loan.returnDate ? new Date(loan.returnDate) : null
    });
  });
};

export const saveBooks = async (): Promise<void> => {
  await writeJson(booksFile, Array.from(books.values()));
};

export const saveUsers = async (): Promise<void> => {
  await writeJson(usersFile, Array.from(users.values()));
};

export const saveLoans = async (): Promise<void> => {
  const data: PersistedLoan[] = Array.from(loans.values()).map((loan) => ({
    ...loan,
    loanDate: loan.loanDate.toISOString(),
    returnDate: loan.returnDate ? loan.returnDate.toISOString() : null
  }));
  await writeJson(loansFile, data);
};
