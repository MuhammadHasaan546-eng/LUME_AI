import User from "../models/User.models.js";
import { googleAuthValidation } from "../validations/user.validation.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import wrapAsync from "../utils/wrapAsync.js";

export const googleAuth = wrapAsync(async (req, res) => {
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
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.status(200).json(new ApiResponse(200, { token, user }, isNewUser ? "User created successfully" : "User logged in successfully"));
});

export const logout = wrapAsync(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
