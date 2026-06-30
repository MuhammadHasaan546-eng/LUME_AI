import express from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

// ── User profile ──
router.get("/me", verifyJWT, getCurrentUser);

export default router;
