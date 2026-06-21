import Joi from "joi";

export const generateWebsiteValidation = Joi.object({
  prompt: Joi.string().min(3).max(5000).required().messages({
    "string.empty": "Prompt is required",
    "string.min": "Prompt must be at least 3 characters",
    "string.max": "Prompt must be at most 5000 characters",
  }),
});

export const updateWebsiteValidation = Joi.object({
  websiteId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Website ID is required",
    "string.hex": "Invalid website ID format",
    "string.length": "Invalid website ID format",
  }),
  prompt: Joi.string().min(3).max(5000).required().messages({
    "string.empty": "Prompt is required",
    "string.min": "Prompt must be at least 3 characters",
    "string.max": "Prompt must be at most 5000 characters",
  }),
});
