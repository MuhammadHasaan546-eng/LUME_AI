import express from "express";
import IsAuth from "../middleware/isAuth.js";
import validate from "../middleware/validate.js";
import {
  generateWebSite,
  updateWebsite,
  getUserWebsites,
  getWebsiteById,
  deleteWebsite,
} from "../controllers/website.controller.js";
import {
  generateWebsiteValidation,
  updateWebsiteValidation,
} from "../validations/website.validation.js";

const router = express.Router();

// ── Website generation & management ──
router.post(
  "/generate-website",
  IsAuth,
  validate(generateWebsiteValidation),
  generateWebSite,
);
router.get("/websites", IsAuth, getUserWebsites);

router.put(
  "/website-update",
  IsAuth,
  validate(updateWebsiteValidation),
  updateWebsite,
);

router.get("/websites", IsAuth, getUserWebsites);
router.get("/website/:websiteId", IsAuth, getWebsiteById);
router.delete("/website/:websiteId", IsAuth, deleteWebsite);

export default router;
