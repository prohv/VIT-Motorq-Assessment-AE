import express from "express";
import cors from "cors";
import { buildTrackActiveHandler } from "./controllers/trackActiveController";

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Track active building endpoint
app.post("/api/track-active/build", buildTrackActiveHandler);

export default app;
