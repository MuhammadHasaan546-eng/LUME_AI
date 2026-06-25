import Joi from "joi";
import { PLAN } from "../config/plain.js";

export const createCheckoutSessionValidation = Joi.object({
  planType: Joi.string()
    .valid(PLAN.PREMIUM, PLAN.ENTERPRISE)
    .required()
    .messages({
      "any.only": "Plan type must be either premium or enterprise",
      "any.required": "Plan type is required",
      "string.empty": "Plan type is required",
    }),
  billingPeriod: Joi.string()
    .valid("monthly", "yearly")
    .default("monthly")
    .messages({
      "any.only": "Billing period must be either monthly or yearly",
    }),
});
