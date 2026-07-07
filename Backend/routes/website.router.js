import express from "express";
import IsAuth from "../middleware/isAuth.js";
import validate from "../middleware/validate.js";
import {
  generateWebSite,
  updateWebsite,
  getUserWebsites,
  getWebsiteById,
  getLiveWebsite,
  getShowcaseWebsites,
  deleteWebsite,
  deployWebsite,
  savePageData,
} from "../controllers/website.controller.js";
import {
  generateWebsiteValidation,
  updateWebsiteValidation,
  savePageDataValidation,
} from "../validations/website.validation.js";

const router = express.Router();

// ── Website generation & management ──
router.post(
  "/generate-website",
  IsAuth,
  validate(generateWebsiteValidation),
  generateWebSite,
);

router.put(
  "/website-update",
  IsAuth,
  validate(updateWebsiteValidation),
  updateWebsite,
);

// ── pageData persistence (Single Source of Truth) ──
// The Editor autosaves the full JSON page definition in a single call.
router.put(
  "/website/save-page-data",
  IsAuth,
  validate(savePageDataValidation),
  savePageData,
);

// PUBLIC — showcase gallery of all deployed websites (no auth required)
router.get("/showcase", getShowcaseWebsites);

router.get("/websites", IsAuth, getUserWebsites);
router.get("/website/:websiteId", IsAuth, getWebsiteById);
router.get("/live-site/:websiteId", getLiveWebsite);
router.delete("/website/:websiteId", IsAuth, deleteWebsite);
router.post("/website/:websiteId/deploy", IsAuth, deployWebsite);

export default router;
