// Creates the very first administrator account on a fresh deployment.
// Runs at container startup but only does anything when the database has NO users,
// so it never overwrites or wipes existing data (unlike the demo seed).
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`[bootstrap] ${count} user(s) already exist — nothing to do.`);
    return;
  }

  const email = (process.env.ADMIN_EMAIL || "admin@firm.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  const name = process.env.ADMIN_NAME || "Administrator";

  await prisma.user.create({
    data: {
      email,
      name,
      role: Role.PARTNER,
      title: "Managing Partner",
      passwordHash: bcrypt.hashSync(password, 10),
      avatarColor: "#1f47f5",
    },
  });

  console.log(`[bootstrap] Created initial admin account: ${email}`);
  console.log("[bootstrap] Log in, then change this password under 'My Account'.");
}

main()
  .catch((e) => {
    console.error("[bootstrap] error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
