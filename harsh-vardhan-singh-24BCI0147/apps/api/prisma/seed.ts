import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding database...");
  // Add boilerplate seed data here
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
