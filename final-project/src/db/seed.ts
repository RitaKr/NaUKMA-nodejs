import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./client";

async function seed() {
  console.log("Seeding database...");

  const adminEmail = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash("admin12345", 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Created admin user: ${adminEmail} / admin12345`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  await prisma.$disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
