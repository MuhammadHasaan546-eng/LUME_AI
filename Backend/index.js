import express from "express";
import "dotenv/config";
import main from "./config/db.js";
import AuthRouter from "./routes/auth.router.js";
import UserRouter from "./routes/user.router.js";
import WebsiteRouter from "./routes/website.router.js";
import BillingRouter from "./routes/billing.router.js";
import { stripeWebhook } from "./controllers/billing.controller.js";
import cookieParser from "cookie-parser";
import cors from "cors";

// Fail fast if required environment variables are missing.
// This prevents silent 500s on /api/auth/google and /api/user/me.
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

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
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

app.use((err, req, res, next) => {
  const { message = "Something went wrong ", statusCode = 500 } = err;
  res.status(statusCode).json({ message });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
