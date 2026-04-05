import User from "../models/User.models.js";
import { googleAuthValidation } from "../validations/user.validation.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

export const googleAuth = async (req, res) => {
  try {
    const validation = googleAuthValidation.validate(req.body);
    if (validation.error) {
      throw new ExpressError(validation.error.details[0].message, 400);
    }
    const { name, email, avatar } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new ExpressError("User already exists", 400);
    }
    const newUser = await User({ name, email, avatar });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(new ApiResponse(200, {}, "User created successfully"));
  } catch (error) {
    throw new ExpressError(error.message, error.statusCode);
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res
      .status(200)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ExpressError(error.message, error.statusCode);
  }
};
