import express from "express";
import IsAuth from "../middleware/isAuth.js";
import validate from "../middleware/validate.js";
import {
  generateComponentHandler,
  getUserComponents,
  getComponentById,
  deleteComponent,
} from "../controllers/agent.controller.js";
import { generateComponentValidation } from "../validations/agent.validation.js";

const router = express.Router();

// ── Multi-agent component generation & management ──
router.post(
  "/generate-component",
  IsAuth,
  validate(generateComponentValidation),
  generateComponentHandler,
);

router.get("/components", IsAuth, getUserComponents);
router.get("/component/:componentId", IsAuth, getComponentById);
router.delete("/component/:componentId", IsAuth, deleteComponent);

export default router;
