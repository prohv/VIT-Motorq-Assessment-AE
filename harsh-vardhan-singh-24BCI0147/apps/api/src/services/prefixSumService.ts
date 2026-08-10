import { prisma } from "../lib/prisma";

/**
 * Prefix Sum Optimization for Analytics Queries
 *
 * Instead of scanning all events for each query, we:
 * 1. Pre-aggregate hourly counts (hourly_user_counts table)
 * 2. Compute cumulative prefix sums (prefix_sum_table table)
 * 3. Query with O(1) range lookups: result = prefix[end] - prefix[start-1]
 */

/**
 * Get unique users in a time range using prefix sum
 * Uses O(1) lookup instead of scanning all records
 */
export async function getUniqueUsersWithPrefixSum(
  startTime: Date,
  endTime: Date,
  dimension?: { country?: string; device?: string; category?: string }
) {
  const whereClause: any = {
    hour: {
      gte: startTime,
      lte: endTime,
    },
  };

  if (dimension?.country) {
    whereClause.country = dimension.country;
  }
  if (dimension?.device) {
    whereClause.device = dimension.device;
  }
  if (dimension?.category) {
    whereClause.category = dimension.category;
  }

  // Get all prefix sum entries in range
  const entries = await prisma.prefix_sum_table.findMany({
    where: whereClause,
    orderBy: { hour: "asc" },
  });

  if (entries.length === 0) {
    return { count: 0, method: "prefix_sum" };
  }

  // Find the smallest slot_index in range
  const minSlot = entries.reduce((min, e) => Math.min(min, e.slot_index), Infinity);

  // Find the largest slot_index in range
  const maxSlot = entries.reduce((max, e) => Math.max(max, e.slot_index), 0);

  // Get cumulative value just before the range starts
  const beforeEntries = await prisma.prefix_sum_table.findMany({
    where: {
      ...whereClause,
      slot_index: { lt: minSlot },
    },
    orderBy: { slot_index: "desc" },
    take: 1,
  });

  const startCumulative = beforeEntries.length > 0 ? Number(beforeEntries[0].cumulative_users) : 0;
  const endCumulative = entries.reduce((sum, e) => sum + Number(e.cumulative_users), 0);

  return {
    count: endCumulative - startCumulative,
    method: "prefix_sum",
    details: {
      entriesInRange: entries.length,
      startCumulative,
      endCumulative,
    },
  };
}

/**
 * Get breakdown by country using prefix sum
 */
export async function getBreakdownByCountryPrefixSum(startTime: Date, endTime: Date) {
  const result = await prisma.prefix_sum_table.findMany({
    where: {
      hour: { gte: startTime, lte: endTime },
    },
    select: {
      country: true,
      cumulative_users: true,
      slot_index: true,
    },
    orderBy: [{ country: "asc" }, { slot_index: "desc" }],
  });

  // Group by country, take the last entry (most recent) per country
  const countryMap = new Map<string, number>();
  for (const entry of result) {
    if (!countryMap.has(entry.country)) {
      countryMap.set(entry.country, Number(entry.cumulative_users));
    }
  }

  // Subtract the value before the range starts for each country
  const countries = await prisma.prefix_sum_table.findMany({
    where: {
      hour: { lt: startTime },
    },
    select: { country: true, cumulative_users: true },
    distinct: ["country"],
  });

  const beforeMap = new Map<string, number>();
  for (const entry of countries) {
    beforeMap.set(entry.country, Number(entry.cumulative_users));
  }

  const breakdown = Array.from(countryMap.entries()).map(([country, total]) => ({
    country,
    count: total - (beforeMap.get(country) || 0),
  }));

  return {
    data: breakdown.sort((a, b) => b.count - a.count),
    method: "prefix_sum",
  };
}

/**
 * Get breakdown by device using prefix sum
 */
export async function getBreakdownByDevicePrefixSum(startTime: Date, endTime: Date) {
  const result = await prisma.prefix_sum_table.findMany({
    where: {
      hour: { gte: startTime, lte: endTime },
    },
    select: {
      device: true,
      cumulative_users: true,
      slot_index: true,
    },
    orderBy: [{ device: "asc" }, { slot_index: "desc" }],
  });

  const deviceMap = new Map<string, number>();
  for (const entry of result) {
    if (!deviceMap.has(entry.device)) {
      deviceMap.set(entry.device, Number(entry.cumulative_users));
    }
  }

  const devices = await prisma.prefix_sum_table.findMany({
    where: {
      hour: { lt: startTime },
    },
    select: { device: true, cumulative_users: true },
    distinct: ["device"],
  });

  const beforeMap = new Map<string, number>();
  for (const entry of devices) {
    beforeMap.set(entry.device, Number(entry.cumulative_users));
  }

  const breakdown = Array.from(deviceMap.entries()).map(([device, total]) => ({
    device,
    count: total - (beforeMap.get(device) || 0),
  }));

  return {
    data: breakdown.sort((a, b) => b.count - a.count),
    method: "prefix_sum",
  };
}

/**
 * Get breakdown by category using prefix sum
 */
export async function getBreakdownByCategoryPrefixSum(startTime: Date, endTime: Date) {
  const result = await prisma.prefix_sum_table.findMany({
    where: {
      hour: { gte: startTime, lte: endTime },
    },
    select: {
      category: true,
      cumulative_users: true,
      slot_index: true,
    },
    orderBy: [{ category: "asc" }, { slot_index: "desc" }],
  });

  const categoryMap = new Map<string, number>();
  for (const entry of result) {
    if (!categoryMap.has(entry.category)) {
      categoryMap.set(entry.category, Number(entry.cumulative_users));
    }
  }

  const categories = await prisma.prefix_sum_table.findMany({
    where: {
      hour: { lt: startTime },
    },
    select: { category: true, cumulative_users: true },
    distinct: ["category"],
  });

  const beforeMap = new Map<string, number>();
  for (const entry of categories) {
    beforeMap.set(entry.category, Number(entry.cumulative_users));
  }

  const breakdown = Array.from(categoryMap.entries()).map(([category, total]) => ({
    category,
    count: total - (beforeMap.get(category) || 0),
  }));

  return {
    data: breakdown.sort((a, b) => b.count - a.count),
    method: "prefix_sum",
  };
}

/**
 * Utility: Build prefix sum from hourly counts
 * Run this periodically (e.g., every hour via cron job)
 */
export async function rebuildPrefixSums() {
  // Get all hourly data
  const hourlyData = await prisma.hourly_user_counts.findMany({
    orderBy: { hour: "asc" },
  });

  // Clear existing prefix sums
  await prisma.prefix_sum_table.deleteMany({});

  if (hourlyData.length === 0) return { rebuilt: 0 };

  // Group by dimension key (country + device + category)
  const grouped = new Map<string, typeof hourlyData>();
  for (const entry of hourlyData) {
    const key = `${entry.country}|${entry.device}|${entry.category}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }

  // Build prefix sums for each dimension
  let rebuiltCount = 0;
  for (const [key, entries] of grouped) {
    const [country, device, category] = key.split("|");
    let cumulative = 0;

    for (let i = 0; i < entries.length; i++) {
      cumulative += Number(entries[i].unique_users);
      await prisma.prefix_sum_table.create({
        data: {
          hour: entries[i].hour,
          country,
          device,
          category,
          cumulative_users: BigInt(cumulative),
          slot_index: i,
        },
      });
      rebuiltCount++;
    }
  }

  return { rebuilt: rebuiltCount };
}

/**
 * Utility: Aggregate events into hourly counts
 * Run this periodically to maintain the hourly_user_counts table
 */
export async function aggregateToHourly() {
  // Get the last aggregated hour
  const lastHour = await prisma.hourly_user_counts.findFirst({
    orderBy: { hour: "desc" },
    select: { hour: true },
  });

  const startDate = lastHour
    ? new Date(lastHour.hour.getTime() + 3600000)  // +1 hour
    : new Date("2024-01-01");

  // Aggregate events into hourly counts with dimensions
  const result = await prisma.$queryRawUnsafe<any[]>`
    SELECT
      date_trunc('hour', e.timestamp) as hour,
      e.country,
      e.device,
      c.category,
      COUNT(DISTINCT e.user_id) as unique_users
    FROM events e
    LEFT JOIN content c ON e.video_id = c.video_id
    WHERE e.timestamp >= ${startDate}
    GROUP BY date_trunc('hour', e.timestamp), e.country, e.device, c.category
    ORDER BY hour
  `;

  if (result.length === 0) return { aggregated: 0 };

  // Upsert hourly counts
  for (const row of result) {
    await prisma.hourly_user_counts.upsert({
      where: {
        hour_country_device_category: {
          hour: row.hour,
          country: row.country || "unknown",
          device: row.device || "unknown",
          category: row.category || "unknown",
        },
      },
      create: {
        hour: row.hour,
        country: row.country || "unknown",
        device: row.device || "unknown",
        category: row.category || "unknown",
        unique_users: BigInt(row.unique_users),
      },
      update: {
        unique_users: BigInt(row.unique_users),
      },
    });
  }

  // Rebuild prefix sums after aggregation
  await rebuildPrefixSums();

  return { aggregated: result.length };
}