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

// ── pageData persistence ──
// The Editor autosaves the full JSON page definition in a single API call.
// `pageData` is the Single Source of Truth (schemaVersion, meta, header,
// sections[], footer). We validate the top-level shape lightly here; deep
// normalization happens on the frontend via normalizePageData().
export const savePageDataValidation = Joi.object({
  websiteId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Website ID is required",
    "string.hex": "Invalid website ID format",
    "string.length": "Invalid website ID format",
  }),
  pageData: Joi.object({
    schemaVersion: Joi.number().integer().min(1).required(),
    meta: Joi.object({
      title: Joi.string().allow("").default(""),
      description: Joi.string().allow("").default(""),
      lang: Joi.string().allow("").default("en"),
      theme: Joi.object().default({}),
    }).default({}),
    header: Joi.object().default({}),
    sections: Joi.array().items(Joi.object()).default([]),
    footer: Joi.object().default({}),
  }).required(),
}).required();
