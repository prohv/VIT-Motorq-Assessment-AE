/**
 * Prefix Sum Test Suite
 * Tests the prefix sum optimization for analytics queries
 */

import { prisma } from "./lib/prisma";
import {
  getBreakdownByCountryPrefixSum,
  getBreakdownByDevicePrefixSum,
  getBreakdownByCategoryPrefixSum,
  aggregateToHourly,
  rebuildPrefixSums,
} from "./services/prefixSumService";
import { getActiveUsersByCountry, getActiveUsersByDevice } from "./services/breakdownService";

async function seedTestData() {
  console.log("🧹 Clearing existing prefix sum tables...");
  await prisma.prefix_sum_table.deleteMany({});
  await prisma.hourly_user_counts.deleteMany({});

  console.log("📊 Seeding test hourly data...");

  // Create hourly counts for 24 hours (simulating 2 days)
  const hours: Array<{ hour: Date; country: string; device: string; category: string; unique_users: bigint }> = [];
  const countries = ["US", "IN", "UK", "DE"];
  const devices = ["mobile", "desktop", "tablet"];
  const categories = ["music", "sports", "tech"];

  const baseDate = new Date("2024-01-01T00:00:00Z");

  // Day 1: 24 hours of data
  for (let day = 0; day < 2; day++) {
    for (let h = 0; h < 24; h++) {
      const hour = new Date(baseDate.getTime() + (day * 24 + h) * 3600000);

      for (const country of countries) {
        for (const device of devices) {
          for (const category of categories) {
            // Simulate varying counts based on hour, day, and dimension
            const baseCount = 10 + (h % 12) * 2 + (day === 0 ? 5 : 15);
            const count = Math.floor(baseCount * (country === "US" ? 2 : 1) * (device === "mobile" ? 1.5 : 1));

            hours.push({
              hour,
              country,
              device,
              category,
              unique_users: BigInt(count),
            });
          }
        }
      }
    }
    console.log(`  Day ${day + 1}: 24 hours × ${countries.length} × ${devices.length} × ${categories.length} = ${24 * countries.length * devices.length * categories.length} entries`);
  }

  // Bulk insert
  await prisma.hourly_user_counts.createMany({
    data: hours.map(h => ({
      hour: h.hour,
      country: h.country,
      device: h.device,
      category: h.category,
      unique_users: h.unique_users,
    })),
  });

  console.log(`✅ Seeded ${hours.length} hourly count entries`);
  return hours.length;
}

async function buildPrefixSums() {
  console.log("\n🔨 Building prefix sums...");

  // Group and build prefix sums
  const hourlyData = await prisma.hourly_user_counts.findMany({
    orderBy: { hour: "asc" },
  });

  const grouped = new Map<string, typeof hourlyData>();
  for (const entry of hourlyData) {
    const key = `${entry.country}|${entry.device}|${entry.category}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }

  let rebuiltCount = 0;
  for (const [key, entries] of grouped) {
    const [country, device, category] = key.split("|");
    let cumulative = 0;

    for (let i = 0; i < entries.length; i++) {
      await prisma.prefix_sum_table.create({
        data: {
          hour: entries[i].hour,
          country,
          device,
          category,
          cumulative_users: entries[i].unique_users, // cumulative updated below
          slot_index: i,
        },
      });
      rebuiltCount++;
    }
  }

  console.log(`✅ Built prefix sums for ${rebuiltCount} entries`);
  return rebuiltCount;
}

async function fixCumulativeValues() {
  // Now update cumulative_users to be actually cumulative
  const groups = await prisma.prefix_sum_table.groupBy({
    by: ["country", "device", "category"],
  });

  for (const group of groups) {
    const entries = await prisma.prefix_sum_table.findMany({
      where: {
        country: group.country,
        device: group.device,
        category: group.category,
      },
      orderBy: { slot_index: "asc" },
    });

    let cumulative = 0;
    for (const entry of entries) {
      cumulative += Number(entry.cumulative_users);
      await prisma.prefix_sum_table.update({
        where: { hour_country_device_category: {
          hour: entry.hour,
          country: group.country,
          device: group.device,
          category: group.category,
        }},
        data: { cumulative_users: BigInt(cumulative) },
      });
    }
  }
  console.log("✅ Fixed cumulative values");
}

async function runPrefixSumQueries() {
  console.log("\n📈 Running prefix sum queries...\n");

  // Test 1: Full day query (Day 1)
  const day1Start = new Date("2024-01-01T00:00:00Z");
  const day1End = new Date("2024-01-01T23:59:59Z");

  console.log("Test 1: Country breakdown for Day 1 (00:00 - 23:59 Jan 1)");
  const day1CountryResult = await getBreakdownByCountryPrefixSum(day1Start, day1End);
  console.log(JSON.stringify(day1CountryResult, null, 2));

  // Test 2: Full day query (Day 2)
  const day2Start = new Date("2024-01-02T00:00:00Z");
  const day2End = new Date("2024-01-02T23:59:59Z");

  console.log("\nTest 2: Country breakdown for Day 2 (00:00 - 23:59 Jan 2)");
  const day2CountryResult = await getBreakdownByCountryPrefixSum(day2Start, day2End);
  console.log(JSON.stringify(day2CountryResult, null, 2));

  // Test 3: Multi-day range (both days)
  console.log("\nTest 3: Country breakdown for Both Days (Jan 1-2)");
  const bothDaysResult = await getBreakdownByCountryPrefixSum(day1Start, day2End);
  console.log(JSON.stringify(bothDaysResult, null, 2));

  // Test 4: Partial day (morning only)
  const morningStart = new Date("2024-01-01T06:00:00Z");
  const morningEnd = new Date("2024-01-01T12:00:00Z");

  console.log("\nTest 4: Country breakdown for Morning (06:00 - 12:00 Jan 1)");
  const morningResult = await getBreakdownByCountryPrefixSum(morningStart, morningEnd);
  console.log(JSON.stringify(morningResult, null, 2));

  // Test 5: Device breakdown
  console.log("\nTest 5: Device breakdown for Day 1");
  const deviceResult = await getBreakdownByDevicePrefixSum(day1Start, day1End);
  console.log(JSON.stringify(deviceResult, null, 2));

  // Test 6: Category breakdown
  console.log("\nTest 6: Category breakdown for Day 1");
  const categoryResult = await getBreakdownByCategoryPrefixSum(day1Start, day1End);
  console.log(JSON.stringify(categoryResult, null, 2));
}

async function verifyCorrectness() {
  console.log("\n🔍 Verifying prefix sum correctness...");

  // Manual calculation for verification
  const day1Start = new Date("2024-01-01T00:00:00Z");
  const day1End = new Date("2024-01-01T23:59:59Z");

  // Calculate expected values manually from hourly_user_counts
  const manualCount = await prisma.$queryRawUnsafe<{ country: string; total: bigint }[]>`
    SELECT country, SUM(unique_users) as total
    FROM hourly_user_counts
    WHERE hour >= ${day1Start} AND hour <= ${day1End}
    GROUP BY country
    ORDER BY total DESC
  `;

  console.log("\nExpected (from hourly_user_counts):");
  console.log(manualCount.map(r => ({ country: r.country, count: Number(r.total) })));

  const prefixSumResult = await getBreakdownByCountryPrefixSum(day1Start, day1End);
  console.log("\nActual (from prefix_sum_table):");
  console.log(prefixSumResult.data);

  // Compare
  const expected = new Map(manualCount.map(r => [r.country, Number(r.total)]));
  const actual = new Map(prefixSumResult.data.map(r => [r.country, r.count]));

  let allMatch = true;
  for (const [country, expectedCount] of expected) {
    const actualCount = actual.get(country);
    const match = actualCount === expectedCount;
    console.log(`  ${country}: expected=${expectedCount}, actual=${actualCount} ${match ? "✅" : "❌"}`);
    if (!match) allMatch = false;
  }

  return allMatch;
}

async function testPerformance() {
  console.log("\n⚡ Performance comparison (simulated)...");

  console.log("\nTraditional approach (scan all hourly data):");
  console.log("  - Time complexity: O(n × d) where n = hours, d = dimensions");
  console.log("  - Each query requires aggregation over the range");

  console.log("\nPrefix sum approach:");
  console.log("  - Time complexity: O(1) for lookup");
  console.log("  - Precomputed cumulative sums");
  console.log("  - Query: prefix_sum[end] - prefix_sum[start-1]");
}

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 Prefix Sum Optimization Test Suite");
  console.log("=".repeat(60));

  try {
    // Step 1: Seed test data
    const entryCount = await seedTestData();

    // Step 2: Build prefix sums
    await buildPrefixSums();

    // Step 3: Fix cumulative values
    await fixCumulativeValues();

    // Step 4: Run queries
    await runPrefixSumQueries();

    // Step 5: Verify correctness
    const allMatch = await verifyCorrectness();

    // Step 6: Performance info
    await testPerformance();

    console.log("\n" + "=".repeat(60));
    if (allMatch) {
      console.log("✅ All tests passed! Prefix sum optimization is working correctly.");
    } else {
      console.log("❌ Some tests failed. Check the output above.");
    }
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();