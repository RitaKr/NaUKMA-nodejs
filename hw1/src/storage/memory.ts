import { Book } from "../types/book";
import { Loan } from "../types/loan";
import { User } from "../types/user";

export const books = new Map<string, Book>();
export const users = new Map<string, User>();
export const loans = new Map<string, Loan>();
