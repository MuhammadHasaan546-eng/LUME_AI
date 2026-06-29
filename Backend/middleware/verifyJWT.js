// Backend /middlewares/auth.middleware.js (IsAuth)
const IsAuth = wrapAsync(async (req, res, next) => {
  // 🔴 Dono jagah se token uthayein (Cookie ya Authorization Header)
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
