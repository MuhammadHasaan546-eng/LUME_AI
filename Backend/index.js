import express from "express";
import "dotenv/config";
import main from "./config/db.js";
import AuthRouter from "./routes/auth.router.js";
import UserRouter from "./routes/user.router.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

main();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);

app.use((err, req, res, next) => {
  const { message = "Something went wrong ", statusCode = 500 } = err;
  res.status(statusCode).json({ message });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
