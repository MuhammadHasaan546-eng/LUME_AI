// Force Node's DNS resolver to prefer IPv4 addresses.
// Some Render/MongoDB Atlas clusters resolve AAAA (IPv6) records that the
// container can't route, causing ENOTFOUND. ipv4first avoids that.
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import AuthRouter from "./routes/auth.router.js";
import UserRouter from "./routes/user.router.js";
import WebsiteRouter from "./routes/website.router.js";
import BillingRouter from "./routes/billing.router.js";
import AgentRouter from "./routes/agent.router.js";
import { stripeWebhook } from "./controllers/billing.controller.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import https from "node:https"; // Built-in
import fs from "node:fs"; // Built-in
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fail fast if required environment variables are missing.
const REQUIRED_ENV = ["JWT_SECRET", "MONGODB_URL"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  console.error("   Add them to Backend/.env before starting the server.");
  process.exit(1);
}

const app = express();

// ── Request logging (lightweight) ──
// On Render, the only way to see what a 500 was triggered by is the log
// stream. This logs every request with a timestamp so you can correlate a
// client-reported 500 with the exact server log line.
app.use((req, _res, next) => {
  const start = Date.now();
  // Defer logging until the response finishes so we can include status + duration.
  _res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      _res.statusCode >= 500
        ? "ERROR"
        : _res.statusCode >= 400
          ? "WARN"
          : "INFO";
    console.log(
      `[${level}] ${new Date().toISOString()} ${req.method} ${req.originalUrl} → ${_res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

app.use(cookieParser());

// CORS configuration.
// IMPORTANT for cross-origin cookies (this app uses withCredentials + JWT in
// a cookie): the EXACT origin must be listed, credentials must be true, and
// the cookie must be set with sameSite:"none" + secure:true (see auth.controller).
app.use(
  cors({
    origin: [
      "https://localhost:5173",
      "https://localhost:5174",
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.CLIENT_URL, // Production frontend URL from .env
    ].filter(Boolean), // drop undefined values
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// Stripe webhook needs the raw body — must come BEFORE express.json().
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json());

// ── Health check ──
// Render pings this to decide if the service is "live". Without it, Render
// may mark the service unhealthy during a slow DB connect and recycle it.
// It also gives you a fast way to confirm the server is up independent of
// the database (the /health/db variant checks the DB too).
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/health/db", async (_req, res) => {
  // 1 = connected, 0 = anything else (connecting/disconnected/disconnecting)
  const readyState = (await import("mongoose")).default.connection.readyState;
  const stateName = [
    "disconnected",
    "connected",
    "connecting",
    "disconnecting",
  ][readyState];
  res.status(readyState === 1 ? 200 : 503).json({
    status: readyState === 1 ? "ok" : "degraded",
    dbState: stateName,
    readyState,
  });
});

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/website", WebsiteRouter);
app.use("/api/billing", BillingRouter);
app.use("/api/agent", AgentRouter);

// 404 for unmatched routes — must come BEFORE the error handler.
app.use(notFoundHandler);

// Centralized error handler — must be the LAST middleware.
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// FIX: Production aur Local ka environment check
const isProduction = process.env.NODE_ENV === "production";

/**
 * Boot the server. We await the DB connection BEFORE listening so that no
 * request can arrive before Mongoose is ready — this eliminates the
 * "buffering timed out" 500s that happen on Render cold starts.
 */
async function startServer() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB ready, starting HTTP server...");
  } catch (err) {
    // If the DB can't be reached at boot, there's no point serving requests.
    console.error("❌ Failed to connect to database at startup. Aborting.");
    process.exit(1);
  }

  if (isProduction) {
    // Production: plain HTTP (Render terminates TLS at the load balancer).
    app.listen(PORT, () => {
      console.log(`🚀 Production Server is running on port ${PORT}`);
    });
  } else {
    // Local development: HTTPS with self-signed certs.
    try {
      const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, "certs", "localhost+1.key")),
        cert: fs.readFileSync(path.join(__dirname, "certs", "localhost+1.crt")),
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(
          `🔒 Secure Local Server is running on https://localhost:${PORT}`,
        );
      });
    } catch (error) {
      console.error(
        "❌ Failed to start local HTTPS server. Make sure certs exist.",
      );
      console.error(error.message);
      process.exit(1);
    }
  }
}

// ── Process-level safety nets ──
// On Render, an unhandled rejection/exception silently kills the process
// and the container restarts with NO useful log. Catching them here ensures
// the real error is logged before exit.
process.on("unhandledRejection", (reason, _promise) => {
  console.error("💥 UNHANDLED REJECTION:", reason);
  // Don't exit immediately — let in-flight requests finish where possible.
  // Render will recycle the container if it actually crashes.
});

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
  // An uncaught exception means the process state is unreliable. Log and exit
  // so Render restarts a clean instance.
  process.exit(1);
});

startServer();
