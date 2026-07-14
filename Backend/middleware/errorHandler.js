import ExpressError from "../utils/ExpressError.js";

/**
 * Centralized error-handling middleware.
 *
 * This is the LAST `app.use` in index.js. Every thrown/next()'d error lands
 * here. The previous handler only did `res.status(statusCode).json({ message })`
 * with NO logging, so on Render the real stack trace was swallowed and the
 * client just saw a bare 500 — making the failure impossible to diagnose.
 *
 * Responsibilities:
 *  1. Log a rich, structured error record (method, url, status, stack, and
 *     Mongoose-specific fields) so the Render log stream is actionable.
 *  2. Map Mongoose driver errors to correct HTTP status codes so a bad
 *     ObjectId (CastError) returns 400 instead of leaking as a 500.
 *  3. Never leak internal details to the client in production.
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Convert a Mongoose / driver error into an ExpressError with a sane status.
 * Returns null if the error is not a recognized Mongoose error.
 */
function mapMongooseError(err) {
  // Bad ObjectId or wrong field type → 400 Bad Request, not 500.
  if (err.name === "CastError") {
    return new ExpressError(
      `Invalid ${err.path}: "${err.value}" is not a valid ${err.kind}.`,
      400,
    );
  }

  // Schema validation failure → 400.
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ");
    return new ExpressError(messages || "Validation failed", 400);
  }

  // Unique-index violation → 409 Conflict.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ") || "field";
    return new ExpressError(
      `Duplicate value for ${field}. It must be unique.`,
      409,
    );
  }

  // Strict mode / DivergentArrayError etc. → 400.
  if (err.name === "StrictModeError") {
    return new ExpressError(err.message, 400);
  }

  return null;
}

/**
 * Express error-handling middleware. MUST have 4 args (err, req, res, next).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Start from the thrown error's status, defaulting to 500.
  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Map known Mongoose errors to proper status codes.
  if (!(err instanceof ExpressError)) {
    const mapped = mapMongooseError(err);
    if (mapped) {
      status = mapped.statusCode;
      message = mapped.message;
    }
  }

  // JWT errors (defensive — isAuth already wraps these, but a stray token
  // error from another path should still be 401, not 500).
  if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
    status = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Authentication token expired";
  }

  // ── Structured server-side log (this is the key fix for diagnosing 500s) ──
  const logPayload = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    status,
    errorName: err.name,
    message: err.message,
    stack: err.stack,
  };

  // Include Mongoose-specific diagnostics when present.
  if (err.name === "CastError") {
    logPayload.path = err.path;
    logPayload.value = err.value;
    logPayload.kind = err.kind;
  }
  if (err.code === 11000) {
    logPayload.keyValue = err.keyValue;
  }
  if (err.errors) {
    logPayload.validationErrors = Object.keys(err.errors);
  }

  // 5xx = server fault → console.error (shows red in Render logs).
  // 4xx = client fault → console.warn (expected, not a server bug).
  if (status >= 500) {
    console.error("🔥 SERVER ERROR:", JSON.stringify(logPayload, null, 2));
  } else {
    console.warn("⚠️  CLIENT ERROR:", JSON.stringify(logPayload, null, 2));
  }

  // ── Client response ──
  // In production, never leak stack traces or internal Mongoose paths.
  const clientMessage =
    isProduction && status >= 500
      ? "Internal server error. Please try again later."
      : message;

  res.status(status).json({
    success: false,
    statusCode: status,
    message: clientMessage,
    // Only expose the stack in development to aid local debugging.
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

/**
 * 404 handler for unmatched routes. Mounted before errorHandler so unknown
 * endpoints get a clean 404 instead of falling through to the 500 handler.
 */
// eslint-disable-next-line no-unused-vars
export function notFoundHandler(req, res, next) {
  console.warn(`⚠️  404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export default errorHandler;
