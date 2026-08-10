import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.events.deleteMany();
  await prisma.content.deleteMany();
  console.log("Deleted all seeded rows");
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