import { prisma } from "../lib/prisma";

export async function getActiveAtTimestamp(xTimestamp: Date) {
  const earlyBorder = new Date(xTimestamp.getTime() - 30 * 1000);
  const lateBorder = new Date(xTimestamp.getTime() + 30 * 1000);

  const records = await prisma.track_active.findMany({
    where: {
      timestamp: {
        gte: earlyBorder,
        lte: lateBorder,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  const countedUsers = new Set<string>();
  const userLastActive = new Map<string, boolean>();

  // Pass 1: track active state per user
  for (const record of records) {
    userLastActive.set(record.user_id, record.active);
  }

  // Pass 2: apply rule engine
  for (const record of records) {
    const userId = record.user_id;
    if (countedUsers.has(userId)) continue;

    // Rule 1: active=true AND timestamp < x
    if (record.active === true && record.timestamp.getTime() < xTimestamp.getTime()) {
      // Check for consecutive record after x within lateBorder
      const laterRecord = records.find(
        r => r.user_id === userId && r.timestamp.getTime() > xTimestamp.getTime()
      );
      if (laterRecord) {
        countedUsers.add(userId);
        continue;
      }
    }

    // Rule 3: active=true AND timestamp == x
    if (record.active === true && record.timestamp.getTime() === xTimestamp.getTime()) {
      countedUsers.add(userId);
      continue;
    }

    // Rule 2: active=false AND timestamp > x AND event_type == PAUSE
    if (record.active === false && record.timestamp.getTime() > xTimestamp.getTime() && record.event_type === "PAUSE") {
      countedUsers.add(userId);
      continue;
    }
  }

  return { count: countedUsers.size };
}