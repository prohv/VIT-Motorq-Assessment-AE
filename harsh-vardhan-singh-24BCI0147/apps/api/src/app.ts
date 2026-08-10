import express from "express";
import cors from "cors";
import { buildTrackActiveHandler } from "./controllers/trackActiveController";
import { getActiveUsersCountHandler, getActiveUsersListHandler } from "./controllers/activeUsersController";

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

// Active users endpoints
app.get("/api/active-users/count", getActiveUsersCountHandler);
app.get("/api/active-users", getActiveUsersListHandler);

export default app;
