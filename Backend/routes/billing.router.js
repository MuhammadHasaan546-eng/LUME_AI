import express from "express";
import {
  createCheckoutSession,
  verifyCheckoutSession,
} from "../controllers/billing.controller.js";
import IsAuth from "../middleware/isAuth.js";
import validate from "../middleware/validate.js";
import { createCheckoutSessionValidation } from "../validations/billing.validation.js";

const router = express.Router();

router.post(
  "/checkout-session",
  IsAuth,
  validate(createCheckoutSessionValidation),
  createCheckoutSession,
);

router.get("/verify-session", IsAuth, verifyCheckoutSession);

export default router;
