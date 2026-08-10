import { Request, Response } from "express";
import { getActiveUsersCount, getActiveUsersInRange } from "../services/activeUsersService";

export async function getActiveUsersCountHandler(req: Request, res: Response) {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      res.status(400).json({ error: "start and end query params required (ISO date)" });
      return;
    }

    const startTime = new Date(start as string);
    const endTime = new Date(end as string);

    const result = await getActiveUsersCount(startTime, endTime);

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get active users count" });
  }
}

export async function getActiveUsersListHandler(req: Request, res: Response) {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      res.status(400).json({ error: "start and end query params required (ISO date)" });
      return;
    }

    const startTime = new Date(start as string);
    const endTime = new Date(end as string);

    const result = await getActiveUsersInRange(startTime, endTime);

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get active users" });
  }
}