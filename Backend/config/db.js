import mongoose from "mongoose";

/**
 * MongoDB connection lifecycle manager.
 *
 * Why this exists:
 *  The previous version called `main()` at module-load time AND again from
 *  `index.js`, without awaiting it before `app.listen()`. On Render's free
 *  tier the server would start accepting requests before Mongoose finished
 *  its initial handshake, so the first query (e.g. `Website.findById`) hit
 *  Mongoose's internal buffer, timed out, and surfaced as an opaque 500.
 *
 * What changed:
 *  - `connectDB()` is now the single entry point and is `await`ed in
 *    `index.js` BEFORE the HTTP server starts listening. No request can
 *    arrive until the DB is reachable.
 *  - Connection events are wired so disconnects/reconnects (common on
 *    Render, which idles and recycles connections) are visible in the logs
 *  - Explicit timeouts make failures fail fast instead of hanging for the
 *    default 30s and returning 500 to the client.
 */

// Fail fast on bad URIs instead of a cryptic Mongoose throw later.
if (!process.env.MONGODB_URL) {
  console.error(
    "❌ MONGODB_URL is not set. Add it to Backend/.env / Render env vars.",
  );
  process.exit(1);
}

// Tuned for Render: short selection timeout so cold-start failures surface
// quickly; long socket timeout so slow queries don't drop mid-flight.
const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 10000, // give the cluster 10s to respond
  socketTimeoutMS: 45000, // keep idle sockets alive for 45s
  // bufferCommands: true (default) is fine because we now connect before
  // listening, so the buffer is only used for genuine transient drops.
};

// Wire connection events ONCE. These persist for the process lifetime and
// are the only way to see DB drops on a long-running Render instance.
mongoose.connection.on("connected", () => {
  console.log("✅ Database connected successfully");
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  Database disconnected — Mongoose will auto-reconnect.");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ Database reconnected");
});

mongoose.connection.on("error", (err) => {
  // `error` is emitted for connection-level failures. Log the full error so
  // the Render dashboard shows the real cause (auth, IP allowlist, DNS, etc.).
  console.error("❌ Database connection error:", err.message);
});

/**
 * Connect to MongoDB. Must be awaited by the caller before starting the
 * HTTP server so no request can arrive before the DB is ready.
 *
 * @returns {Promise<typeof mongoose>} the mongoose instance
 */
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, MONGOOSE_OPTIONS);
    return mongoose;
  } catch (err) {
    // Distinguish the common Render failure modes in the logs.
    const msg = err?.message || String(err);
    if (/ENOTFOUND|EAI_AGAIN/.test(msg)) {
      console.error(
        "❌ DNS resolution failed for MONGODB_URL. Check the URI host and Render's network egress.",
      );
    } else if (/authentication failed|bad auth|EAUTH/.test(msg)) {
      console.error(
        "❌ MongoDB authentication failed. Verify the username/password in MONGODB_URL (URL-encode special chars).",
      );
    } else if (/whitelist|ip|EAUTH/.test(msg)) {
      console.error(
        "❌ Connection blocked by IP allowlist. Add Render's egress IPs (or 0.0.0.0/0) in Atlas Network Access.",
      );
    }
    console.error("❌ Initial DB connection failed:", msg);
    throw err; // let index.js decide whether to exit
  }
}

export default connectDB;
