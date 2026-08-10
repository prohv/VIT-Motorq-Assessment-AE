import { prisma } from "../lib/prisma";
import { EventType } from "@prisma/client";

interface TrackActiveOptions {
  limit?: number;
}

export async function buildTrackActive(options: TrackActiveOptions = {}) {
  const { limit = 1000 } = options;

  const events = await prisma.events.findMany({
    take: limit,
    orderBy: { timestamp: "asc" },
  });

  const activeRecords: { user_id: string; timestamp: Date; event_type: EventType; active: boolean }[] = [];

  // Track last entry per user
  const lastEntryMap = new Map<string, { active: boolean; timestamp: Date }>();

  // Track first event of each session per user
  const sessionFirstEvent = new Set<string>();

  for (const event of events) {
    const { event_type, user_id, session_id, timestamp } = event;

    // Skip SESSION_START
    if (event_type === "SESSION_START") {
      sessionFirstEvent.add(`${user_id}:${session_id}`);
      continue;
    }

    let active: boolean;

    if (event_type === "PLAY") {
      active = true;
    } else if (event_type === "PAUSE" || event_type === "SESSION_END") {
      active = false;
    } else if (event_type === "HEARTBEAT") {
      const lastEntry = lastEntryMap.get(user_id);
      active = lastEntry ? lastEntry.active : true;
    } else {
      continue;
    }

    // Gap rule
    const sessionKey = `${user_id}:${session_id}`;
    const isFirstEventOfSession = sessionFirstEvent.has(sessionKey);
    const lastEntry = lastEntryMap.get(user_id);

    if (event_type !== "HEARTBEAT" && !isFirstEventOfSession && lastEntry) {
      const gapMs = timestamp.getTime() - lastEntry.timestamp.getTime();
      if (gapMs > 30 * 1000) {
        active = false;
      }
    }

    activeRecords.push({
      user_id,
      timestamp,
      event_type,
      active,
    });

    lastEntryMap.set(user_id, { active, timestamp });
  }

  const result = await prisma.track_active.createMany({
    data: activeRecords,
    skipDuplicates: true,
  });

  return { inserted: result.count, total: activeRecords.length };
}