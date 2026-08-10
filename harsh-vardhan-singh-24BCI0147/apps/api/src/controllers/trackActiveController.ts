import { Request, Response } from "express";
import { buildTrackActive } from "../services/trackActiveService";

export async function buildTrackActiveHandler(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 1000;

    const result = await buildTrackActive({ limit });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error building track_active:", error);
    res.status(500).json({ error: "Failed to build track_active" });
  }
}