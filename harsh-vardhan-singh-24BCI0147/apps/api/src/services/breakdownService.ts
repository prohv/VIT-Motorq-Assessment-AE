import { prisma } from "../lib/prisma";

export async function getActiveUsersByCountry(startTime: Date, endTime: Date) {
  const result = await prisma.$queryRaw<
    { country: string; count: bigint }[]
  >`
    SELECT e.country, COUNT(DISTINCT ta.user_id) as count
    FROM track_active ta
    JOIN events e ON ta.user_id = e.user_id AND ta.timestamp = e.timestamp
    WHERE ta.active = true
      AND ta.timestamp >= ${startTime}
      AND ta.timestamp <= ${endTime}
    GROUP BY e.country
    ORDER BY count DESC
  `;

  return {
    data: result.map((r) => ({
      country: r.country,
      count: Number(r.count),
    })),
  };
}

export async function getActiveUsersByDevice(startTime: Date, endTime: Date) {
  const result = await prisma.$queryRaw<
    { device: string; count: bigint }[]
  >`
    SELECT e.device, COUNT(DISTINCT ta.user_id) as count
    FROM track_active ta
    JOIN events e ON ta.user_id = e.user_id AND ta.timestamp = e.timestamp
    WHERE ta.active = true
      AND ta.timestamp >= ${startTime}
      AND ta.timestamp <= ${endTime}
    GROUP BY e.device
    ORDER BY count DESC
  `;

  return {
    data: result.map((r) => ({
      device: r.device,
      count: Number(r.count),
    })),
  };
}

export async function getActiveUsersByVideo(startTime: Date, endTime: Date) {
  const result = await prisma.$queryRaw<
    { video_id: string; title: string; count: bigint }[]
  >`
    SELECT e.video_id, c.title, COUNT(DISTINCT ta.user_id) as count
    FROM track_active ta
    JOIN events e ON ta.user_id = e.user_id AND ta.timestamp = e.timestamp
    JOIN content c ON e.video_id = c.video_id
    WHERE ta.active = true
      AND ta.timestamp >= ${startTime}
      AND ta.timestamp <= ${endTime}
    GROUP BY e.video_id, c.title
    ORDER BY count DESC
  `;

  return {
    data: result.map((r) => ({
      video_id: r.video_id,
      title: r.title,
      count: Number(r.count),
    })),
  };
}