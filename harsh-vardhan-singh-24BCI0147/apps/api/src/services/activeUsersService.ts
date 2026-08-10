import { prisma } from "../lib/prisma";

export async function getActiveUsersCount(startTime: Date, endTime: Date) {
  const result = await prisma.track_active.findMany({
    where: {
      timestamp: {
        gte: startTime,
        lte: endTime,
      },
      active: true,
    },
    distinct: ["user_id"],
    select: { user_id: true },
  });

  return { count: result.length };
}

export async function getActiveUsersInRange(startTime: Date, endTime: Date) {
  const records = await prisma.track_active.findMany({
    where: {
      timestamp: {
        gte: startTime,
        lte: endTime,
      },
      active: true,
    },
    distinct: ["user_id"],
    select: {
      user_id: true,
      timestamp: true,
      event_type: true,
    },
    orderBy: { timestamp: "asc" },
  });

  return {
    count: records.length,
    users: records,
  };
}