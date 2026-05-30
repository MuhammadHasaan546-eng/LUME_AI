import express from "express";
import { googleAuth, logout } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/google", googleAuth);
router.post("/logout", logout);

export default router;
