import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import authRouter from "./routes/auth.routes";
import usersRouter from "./routes/users.routes";
import eventsRouter from "./routes/events.routes";
import bookingsRouter from "./routes/bookings.routes";
import statsRouter from "./routes/stats.routes";
import { HttpError } from "./utils/errors";

const app = express();

app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/events", eventsRouter);
app.use("/bookings", bookingsRouter);
app.use("/stats", statsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
