import { Request, Response } from "express";
import {
  getActiveUsersByCountry,
  getActiveUsersByDevice,
  getActiveUsersByVideo,
} from "../services/breakdownService";

export async function getActiveUsersByCountryHandler(req: Request, res: Response) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: "start and end query params required (ISO date)" });
      return;
    }
    const result = await getActiveUsersByCountry(new Date(start as string), new Date(end as string));
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get breakdown by country" });
  }
}

export async function getActiveUsersByDeviceHandler(req: Request, res: Response) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: "start and end query params required (ISO date)" });
      return;
    }
    const result = await getActiveUsersByDevice(new Date(start as string), new Date(end as string));
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get breakdown by device" });
  }
}

export async function getActiveUsersByVideoHandler(req: Request, res: Response) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: "start and end query params required (ISO date)" });
      return;
    }
    const result = await getActiveUsersByVideo(new Date(start as string), new Date(end as string));
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to get breakdown by video" });
  }
}