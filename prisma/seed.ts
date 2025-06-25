import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mcUsername = "Zyklop";
  const password =
    "$2b$12$kpceNTyxdA8WyVfKc9zruetsDQeNxg6u6AfOYlSvGZJUTyJCARQCK"; // hash for 'test123'

  const existing = await prisma.user.findUnique({ where: { mcUsername } });
  if (!existing) {
    await prisma.user.create({
      data: {
        mcUsername,
        password,
        name: mcUsername,
      },
    });
    console.log("Dummy user Zyklop created.");
  } else {
    console.log("User Zyklop already exists.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
