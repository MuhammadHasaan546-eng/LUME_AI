import express from "express";
import {
  googleAuth,
  googleCallback,
  logout,
} from "../controllers/auth.controller.js";
const router = express.Router();

// JSON-based login (used by the legacy Firebase flow / direct API calls).
router.post("/google", googleAuth);

// Google OAuth 2.0 redirect callback. The browser lands here after the Google
// consent screen with ?code=... (or ?error=... on cancel). See
// auth.controller.js → googleCallback for the full flow.
router.get("/google/callback", googleCallback);

router.post("/logout", logout);

export default router;
