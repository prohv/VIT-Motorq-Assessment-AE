import { Request, Response } from "express";
import { getActiveAtTimestamp } from "../services/activeAtTimestampService";

export async function getActiveAtTimestampHandler(req: Request, res: Response) {
  try {
    const { x } = req.query;
    if (!x) {
      res.status(400).json({ error: "x (timestamp) query param required (ISO date)" });
      return;
    }
    const result = await getActiveAtTimestamp(new Date(x as string));
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get active users at timestamp" });
  }
}