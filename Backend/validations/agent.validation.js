import Joi from "joi";

export const generateComponentValidation = Joi.object({
  prompt: Joi.string().min(3).max(5000).required().messages({
    "string.empty": "Prompt is required",
    "string.min": "Prompt must be at least 3 characters",
    "string.max": "Prompt must be at most 5000 characters",
  }),
});
