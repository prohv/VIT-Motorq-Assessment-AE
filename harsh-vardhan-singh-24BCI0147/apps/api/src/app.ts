import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger-output.json";
import { buildTrackActiveHandler } from "./controllers/trackActiveController";
import { getActiveUsersCountHandler } from "./controllers/activeUsersController";
import { getActiveAtTimestampHandler } from "./controllers/activeAtTimestampController";
import { getActiveUsersByCountryHandler, getActiveUsersByDeviceHandler, getActiveUsersByVideoHandler } from "./controllers/breakdownController";

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Swagger docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Track active building endpoint
app.post("/api/track-active/build", buildTrackActiveHandler);

// Active users endpoints
app.get("/api/active-users/count", getActiveUsersCountHandler);

// Active at specific timestamp
app.get("/api/active-users/at", getActiveAtTimestampHandler);

// Breakdown endpoints
app.get("/api/active-users/by-country", getActiveUsersByCountryHandler);
app.get("/api/active-users/by-device", getActiveUsersByDeviceHandler);
app.get("/api/active-users/by-video", getActiveUsersByVideoHandler);

export default app;
