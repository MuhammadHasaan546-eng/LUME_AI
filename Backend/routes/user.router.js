import express from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import IsAuth from "../middleware/isAuth.js";

const router = express.Router();

// ── User profile ──
router.get("/me", IsAuth, getCurrentUser);

export default router;
