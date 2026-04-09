import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";
import jwt from "jsonwebtoken";

const IsAuth = wrapAsync(async (req, res, next) => {
  const token = req.cookies.token;
  try {
    if (!token) {
      throw new ExpressError("Unauthorized", 401);
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof ExpressError) {
      throw error;
    }
    throw new ExpressError("Unauthorized", 401);
  }
});

export default IsAuth;
