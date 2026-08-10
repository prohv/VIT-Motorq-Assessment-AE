import { prisma } from "../src/lib/prisma";

async function main() {
  const records = await prisma.track_active.findMany({
    orderBy: { timestamp: "asc" },
    take: 20,
  });
  console.log(JSON.stringify(records, null, 2));
}

main().then(() => prisma.$disconnect());