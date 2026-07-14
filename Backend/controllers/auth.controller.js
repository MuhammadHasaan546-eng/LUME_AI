import User from "../models/User.models.js";
import { googleAuthValidation } from "../validations/user.validation.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import wrapAsync from "../utils/wrapAsync.js";

export const googleAuth = wrapAsync(async (req, res, next) => {
  const validation = googleAuthValidation.validate(req.body);
  if (validation.error) {
    throw new ExpressError(validation.error.details[0].message, 400);
  }
  const { name, email, avatar } = req.body;
  let user = await User.findOne({ email });
  let isNewUser = false;
  if (!user) {
    user = await User({ name, email, avatar });
    await user.save();
    isNewUser = true;
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Cookie options MUST match between set and clear, otherwise the browser
  // refuses to delete the cookie (it's scoped by path/domain/sameSite/secure).
  // `secure` must be true for cross-site cookies with sameSite:"none".
  // The previous `|| true` was a tautology that always forced secure=true,
  // which breaks cookie-setting on plain-HTTP local dev (http://localhost).
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd, // HTTPS-only in prod; allow HTTP locally
    sameSite: isProd ? "none" : "lax", // cross-site in prod, same-site locally
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  res.cookie("token", token, cookieOptions);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { token, user },
        isNewUser ? "User created successfully" : "User logged in successfully",
      ),
    );
});

export const logout = wrapAsync(async (req, res, next) => {
  // Clear with the SAME options used to set the cookie, otherwise the browser
  // keeps the stale token and the user appears "still logged in".
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
