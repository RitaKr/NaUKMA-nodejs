import app from "./app";
import { prisma } from "./db/client";

const PORT = parseInt(process.env.PORT || "2500", 10);

async function main() {
  await prisma.$connect();
  console.log("Connected to database.");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
