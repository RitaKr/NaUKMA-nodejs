import app from "./app";
import prisma from "./db/client";

const PORT = process.env.PORT ? Number(process.env.PORT) : 2000;

(async () => {
  await prisma.$connect();
  console.log("Database connected");

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
