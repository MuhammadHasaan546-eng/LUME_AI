import User from "../models/User.models.js";
import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getCurrentUser = wrapAsync(async (req, res) => {
  if (!req.user) {
    throw new ExpressError("Unauthorized", 401);
  }
  const user = await User.findById(req.user.id);
  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User fetched successfully"));
});
