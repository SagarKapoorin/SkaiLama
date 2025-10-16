import dotenv from "dotenv";
dotenv.config();
import type { Application, Request, Response } from "express";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import profileRoutes from "./routes/profileRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import { timezoneDetector } from "./middleware/timezoneMiddleware.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { getAllTimezones } from "./utils/timezoneHelper.js";
import { redisRateLimiter } from "./middleware/rateLimiter.js";
import mongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
connectDB();
connectRedis();

const app: Application = express();

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  redisRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
  }),
);

// timezone detection middleware
app.use(timezoneDetector);
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// route to get detaill of all routes implemented
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Event Management API",
    version: "1.0.0",
    endpoints: {
      profiles: "/api/profiles",
      events: "/api/events",
      timezones: "/api/timezones",
    },
  });
});

app.get("/api/timezones", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: getAllTimezones(),
  });
});

app.use("/api/profiles", profileRoutes);
app.use("/api/events", eventRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || "5000", 10);

const server = app.listen(PORT, () => {
  console.log(
    `Event Management API Server is live on URL: http://localhost:${PORT.toString().padEnd(37)} `,
  );
});

// grraceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n ${signal} signal received: closing HTTP server`);
  server.close(async () => {
    console.log("HTTP server closed");
    try {
      await disconnectRedis();
      console.log("All connections closed");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Rejection:", err);
  gracefulShutdown("UNHANDLED_REJECTION");
});
