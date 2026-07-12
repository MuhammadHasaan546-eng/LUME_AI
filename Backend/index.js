// Force Node's DNS resolver to prefer IPv4 addresses.
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import "dotenv/config";
import main from "./config/db.js";
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

main();
app.use(cookieParser());

// CORS configuration (Production URLs bhi yahan add kar sakte hain baad mein)
app.use(
  cors({
    origin: [
      "https://localhost:5173",
      "https://localhost:5174",
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.CLIENT_URL, // Production frontend URL handle karne ke liye (.env se)
    ].filter(Boolean), // undefined values ko filter karne ke liye
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json());

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/website", WebsiteRouter);
app.use("/api/billing", BillingRouter);
app.use("/api/agent", AgentRouter);

app.use((err, req, res, next) => {
  const { message = "Something went wrong ", statusCode = 500 } = err;
  res.status(statusCode).json({ message });
});

const PORT = process.env.PORT || 3000;

// FIX: Production aur Local ka environment check
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  // Production par normal HTTP server chalega (Hosting provider SSL handle karega)
  app.listen(PORT, () => {
    console.log(` Production Server is running on port ${PORT}`);
  });
} else {
  // Local development par secure HTTPS server chalega
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
      " Failed to start local HTTPS server. Make sure certs exist.",
    );
    console.error(error.message);
    process.exit(1);
  }
}
