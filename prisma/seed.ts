import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password =
    "$2b$12$kpceNTyxdA8WyVfKc9zruetsDQeNxg6u6AfOYlSvGZJUTyJCARQCK"; // hash for 'test123'

  // Create first dummy user
  const mcUsername1 = "Zyklop";
  const existing1 = await prisma.user.findUnique({
    where: { mcUsername: mcUsername1 },
  });
  if (!existing1) {
    await prisma.user.create({
      data: {
        mcUsername: mcUsername1,
        password,
        name: mcUsername1,
        isAdmin: true,
      },
    });
    console.log("Dummy user Zyklop created.");
  } else {
    console.log("User Zyklop already exists.");
  }

  // Create second dummy user
  const mcUsername2 = "TestUser";
  const existing2 = await prisma.user.findUnique({
    where: { mcUsername: mcUsername2 },
  });
  if (!existing2) {
    await prisma.user.create({
      data: {
        mcUsername: mcUsername2,
        password,
        name: mcUsername2,
        isAdmin: true,
      },
    });
    console.log("Dummy user TestUser created.");
  } else {
    console.log("User TestUser already exists.");
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
