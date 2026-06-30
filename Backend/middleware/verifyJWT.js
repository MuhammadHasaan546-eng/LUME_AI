import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";
import jwt from "jsonwebtoken";

// Auth middleware for routes that require a logged-in user.
// Reads the JWT from the httpOnly cookie first (set by the OAuth callback /
// googleAuth), then falls back to the Authorization: Bearer header (used by
// the frontend axios calls that read the token from localStorage).
const verifyJWT = wrapAsync(async (req, res, next) => {
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ExpressError("Unauthorized: No token provided", 401);
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decodedToken.id };
    next();
  } catch (error) {
    throw new ExpressError("Unauthorized: Invalid token", 401);
  }
});

export default verifyJWT;
export { verifyJWT };
