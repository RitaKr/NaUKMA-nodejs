import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import booksRouter from "./routes/books";
import usersRouter from "./routes/users";
import loansRouter from "./routes/loans";
import authRouter from "./routes/auth";
import passport from "./config/passport";
import { HttpError } from "./services/errors";

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/books", booksRouter);
app.use("/users", usersRouter);
app.use("/loans", loansRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
});

export default app;
