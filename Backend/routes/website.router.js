import express from "express";
import IsAuth from "../middleware/isAuth.js";
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
  "/gen",
  IsAuth,
  (req, res, next) => {
    const { error } = generateWebsiteValidation.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ message: messages });
    }
    next();
  },
  generateWebSite,
);

router.put(
  "/website",
  IsAuth,
  (req, res, next) => {
    const { error } = updateWebsiteValidation.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ message: messages });
    }
    next();
  },
  updateWebsite,
);

router.get("/websites", IsAuth, getUserWebsites);
router.get("/website/:websiteId", IsAuth, getWebsiteById);
router.delete("/website/:websiteId", IsAuth, deleteWebsite);

export default router;
