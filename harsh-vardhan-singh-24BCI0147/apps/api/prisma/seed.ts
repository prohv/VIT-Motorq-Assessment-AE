import { prisma } from "../src/lib/prisma";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseCSV(content: string) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i]?.trim() }), {});
  });
}

// async function seedEvents() {
//   const eventsPath = resolve(__dirname, "../../../../data/events.csv");
//   console.log("Reading from:", eventsPath);
//   const data = parseCSV(readFileSync(eventsPath, "utf-8"));
//   console.log(`Seeding ${data.length} events...`);
//
//   for (const row of data) {
//     await prisma.events.create({
//       data: {
//         event_id: row.event_id,
//         session_id: row.session_id,
//         user_id: row.user_id,
//         video_id: row.video_id,
//         timestamp: new Date(row.timestamp),
//         event_type: row.event_type,
//         device: row.device,
//         country: row.country,
//       },
//     });
//   }
//   console.log(`Seeded ${data.length} events`);
// }

async function seedContent() {
  const contentPath = resolve(__dirname, "../../../../data/content.csv");
  console.log("Reading from:", contentPath);
  const data = parseCSV(readFileSync(contentPath, "utf-8"));
  console.log(`Seeding ${data.length} content rows...`);

  for (const row of data) {
    await prisma.content.create({
      data: {
        video_id: row.video_id,
        title: row.title.replace(/"/g, ""),
        category: row.category,
        language: row.language,
      },
    });
  }
  console.log(`Seeded ${data.length} content rows`);
}

async function main() {
  console.log("Seeding database...");
  // await seedEvents();
  await seedContent();
  console.log("Done!");
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