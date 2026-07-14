# Troubleshooting Guide — 500 Internal Server Error

**Symptom:** The frontend at `https://localhost:5173/editor/6a5609ef8fea16946d0c6e9f#features`
makes a `GET https://lume-ai-rfjg.onrender.com/api/website/website/6a5609ef8fea16946d0c6e9f`
and receives a `500 (Internal Server Error)`.

This guide walks through the four most common causes of a 500 on a Render-hosted
Express + MongoDB backend, explains **why** each happens, and shows the exact fix
that was applied to this codebase.

---

## 0. The Request Flow (what actually runs)

```
Browser (https://localhost:5173)
  └─ axios.get("/api/website/website/:websiteId", { withCredentials: true })
       │  VITE_BASE_URL = https://lume-ai-rfjg.onrender.com  →  direct to Render
       ▼
Render (https://lume-ai-rfjg.onrender.com)
  └─ Express app
       ├─ cors()                 ← origin + credentials check
       ├─ cookieParser()
       ├─ express.json()
       ├─ IsAuth                 ← verifies JWT from cookie → sets req.user
       └─ getWebsiteById         ← Website.findById(websiteId) → responds
            └─ on throw → errorHandler  ← maps + logs + responds
```

> **Key deduction:** The error is a **500, not a 401**. That means `IsAuth`
> _passed_ — the JWT cookie was sent cross-origin and verified successfully.
> So this is **not** a CORS-blocking or auth failure; the error is downstream,
> inside the route handler or the database layer.

---

## 1. Backend Route Handler Failures

### 1.1 Unvalidated ObjectId → Mongoose `CastError` → 500

**The bug (before fix):**

```js
// Backend/controllers/website.controller.js (OLD)
export const getWebsiteById = wrapAsync(async (req, res) => {
  const { websiteId } = req.params;
  const website = await Website.findById(websiteId); // ← no validation
  ...
});
```

If `websiteId` is not a valid 24-char hex ObjectId, `findById` throws a
`CastError`. A `CastError` has **no `statusCode` property**, so the old error
handler defaulted to `500`:

```js
// Backend/index.js (OLD)
app.use((err, req, res, next) => {
  const { message = "Something went wrong ", statusCode = 500 } = err;
  res.status(statusCode).json({ message }); // ← CastError → 500
});
```

**The fix — validate before querying:**

```js
// Backend/controllers/website.controller.js (NEW)
export const getWebsiteById = wrapAsync(async (req, res) => {
  const { websiteId } = req.params;

  // Validate BEFORE hitting the DB → clean 400 instead of opaque 500.
  if (!mongoose.isValidObjectId(websiteId)) {
    throw new ExpressError("Invalid website ID", 400);
  }

  const website = await Website.findById(websiteId);
  ...
});
```

### 1.2 Swallowed Error Stack (no server-side logging)

**The bug (before fix):** The old handler responded with `{ message }` but
**never logged the error**. On Render, the only diagnostic surface is the log
stream — so the real stack trace was lost and the 500 was impossible to diagnose.

**The fix — centralized error handler with structured logging:**
see [`Backend/middleware/errorHandler.js`](Backend/middleware/errorHandler.js).

It now:

- Logs a structured JSON record (method, url, status, errorName, message, stack,
  Mongoose-specific fields like `path`/`value`/`keyValue`).
- Uses `console.error` for 5xx (shows red in Render logs) and `console.warn`
  for 4xx (expected client errors).
- Maps Mongoose errors to correct HTTP codes automatically:

| Mongoose error      | Mapped status | Reason                    |
| ------------------- | ------------- | ------------------------- |
| `CastError`         | 400           | Bad ObjectId / field type |
| `ValidationError`   | 400           | Schema validation failed  |
| `code: 11000`       | 409           | Unique-index violation    |
| `StrictModeError`   | 400           | Unknown field in update   |
| `JsonWebTokenError` | 401           | Malformed/expired token   |

```js
// Backend/middleware/errorHandler.js (excerpt)
function mapMongooseError(err) {
  if (err.name === "CastError") {
    return new ExpressError(
      `Invalid ${err.path}: "${err.value}" is not a valid ${err.kind}.`,
      400,
    );
  }
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ");
    return new ExpressError(messages || "Validation failed", 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ") || "field";
    return new ExpressError(`Duplicate value for ${field}.`, 409);
  }
  return null;
}
```

### 1.3 Request Logging (correlate client 500 → server log)

Every request is now logged with method, URL, status, and duration, so you can
match a client-reported 500 to the exact server line:

```js
// Backend/index.js (excerpt)
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      _res.statusCode >= 500
        ? "ERROR"
        : _res.statusCode >= 400
          ? "WARN"
          : "INFO";
    console.log(
      `[${level}] ${new Date().toISOString()} ${req.method} ${req.originalUrl} → ${_res.statusCode} (${duration}ms)`,
    );
  });
  next();
});
```

---

## 2. Database Connection Issues (Render-specific)

### 2.1 Server Listening Before DB Connected

**The bug (before fix):**

```js
// Backend/config/db.js (OLD)
async function main() {
  await mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Database connected successfully");
  });
}
main().catch((err) => console.log(err)); // ← runs at module load

// Backend/index.js (OLD)
main(); // ← called AGAIN, NOT awaited
app.listen(PORT); // ← starts before Mongoose is ready
```

On Render's free tier, the container boots fast but the MongoDB handshake can
take 1–3 seconds (cold cluster, TLS, auth). Because `app.listen` ran before
`connect` resolved, the first request hit Mongoose's internal command buffer.
When that buffer timed out, the query rejected with
`MongooseError: Operation buffering timed out` → **500**.

**The fix — await the DB before listening:**

```js
// Backend/config/db.js (NEW)
export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 10000, // fail fast (10s) instead of 30s hang
    socketTimeoutMS: 45000,
  });
  return mongoose;
}

// Backend/index.js (NEW)
async function startServer() {
  await connectDB(); // ← no request can arrive until DB is ready
  app.listen(PORT, () => {
    // ← only then start listening
    console.log(`🚀 Production Server is running on port ${PORT}`);
  });
}
startServer();
```

### 2.2 Connection Event Monitoring

Render recycles/idles connections. Without event listeners, drops are invisible.
The new `db.js` wires all four events:

```js
mongoose.connection.on("connected", () => console.log("✅ Database connected"));
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  Database disconnected"),
);
mongoose.connection.on("reconnected", () =>
  console.log("✅ Database reconnected"),
);
mongoose.connection.on("error", (err) =>
  console.error("❌ DB error:", err.message),
);
```

### 2.3 Common Render MongoDB Failure Modes

| Log signature                                 | Cause                                                     | Fix                                                              |
| --------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| `ENOTFOUND` / `EAI_AGAIN`                     | DNS can't resolve the cluster host (often IPv6 on Render) | `dns.setDefaultResultOrder("ipv4first")` (already in `index.js`) |
| `authentication failed` / `bad auth`          | Wrong username/password in `MONGODB_URL`                  | Re-check Atlas DB user; URL-encode special chars (`@` → `%40`)   |
| `connection timed out` / `IP not whitelisted` | Atlas Network Access blocks Render's egress IP            | Add `0.0.0.0/0` (or Render's IP range) in Atlas → Network Access |
| `buffering timed out`                         | Query fired before connection established                 | Fixed by awaiting `connectDB()` before `app.listen` (see 2.1)    |
| `Topology was destroyed`                      | Connection dropped mid-query (idle recycle)               | Mongoose auto-reconnects; events now logged (see 2.2)            |

### 2.4 Health Checks

Render pings a health endpoint to decide if the service is "live". Without one,
a slow DB connect can cause Render to mark the service unhealthy and recycle it.
Two endpoints were added:

- `GET /health` — server-only (fast, always 200 if the process is up)
- `GET /health/db` — reports Mongoose `readyState` (1 = connected)

```bash
curl https://lume-ai-rfjg.onrender.com/health
# {"status":"ok","uptime":12.3,"env":"production"}

curl https://lume-ai-rfjg.onrender.com/health/db
# {"status":"ok","dbState":"connected","readyState":1}
```

---

## 3. Environment Variable Misconfigurations

### 3.1 Required Vars

`index.js` fails fast at boot if any required var is missing:

```js
const REQUIRED_ENV = ["JWT_SECRET", "MONGODB_URL"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}
```

### 3.2 Render Environment Variables Checklist

In the Render dashboard → your service → **Environment**, confirm:

| Variable           | Required | Example                                            | Notes                                               |
| ------------------ | -------- | -------------------------------------------------- | --------------------------------------------------- |
| `MONGODB_URL`      | ✅       | `mongodb+srv://user:pass@cluster.x.mongodb.net/db` | URL-encode the password; must include `+srv`        |
| `JWT_SECRET`       | ✅       | (any long random string)                           | Must match the secret used to sign tokens           |
| `NODE_ENV`         | ✅       | `production`                                       | Switches to HTTP server + secure cookies            |
| `CLIENT_URL`       | ⚠️       | `https://your-frontend.onrender.com`               | Added to CORS `origin` list; needed for prod cookie |
| `PORT`             | auto     | (Render injects this)                              | Don't hardcode; `process.env.PORT \|\| 3000`        |
| `HOSTING_BASE_URL` | optional | `https://your-frontend.onrender.com`               | Used by `deployWebsite` to build `deployedUrl`      |

### 3.3 The `NODE_ENV` Cookie Trap

**The bug (before fix):**

```js
// auth.controller.js (OLD)
secure: process.env.NODE_ENV === "production" || true, // ← always true!
```

`|| true` makes this a **tautology** — `secure` was _always_ `true`, even on
`http://localhost`. Browsers silently refuse to set `secure` cookies over HTTP,
so the token was never stored locally → every authenticated request 401'd (and
in some flows surfaced as 500 when the handler assumed `req.user` existed).

**The fix:**

```js
// auth.controller.js (NEW)
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd, // HTTPS-only in prod; HTTP ok locally
  sameSite: isProd ? "none" : "lax", // cross-site in prod, same-site locally
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
```

> **Rule:** `secure: true` requires HTTPS. On Render (HTTPS) it's correct; on
> `http://localhost` it must be `false` or the cookie is silently dropped.

### 3.4 Frontend `VITE_BASE_URL` Mismatch

`Frontend/.env` currently sets:

```
VITE_BASE_URL=https://lume-ai-rfjg.onrender.com
```

This makes axios call Render **directly** (bypassing the Vite proxy in
[`vite.config.js`](Frontend/vite.config.js)). That's fine for production, but
note the implications:

- The JWT cookie is set on the `lume-ai-rfjg.onrender.com` domain.
- For the browser to send it cross-origin to Render, CORS must list the exact
  frontend origin AND `credentials: true` AND the cookie must be
  `sameSite: "none"` + `secure: true` (all now fixed).

If you want to use the Vite proxy instead (avoids cert warnings locally), set:

```
VITE_BASE_URL=
```

Then requests go to same-origin `/api/*` and Vite forwards them to Render.

---

## 4. CORS Issues

### 4.1 The Three Requirements for Cross-Origin Cookies

For `withCredentials: true` + a cookie-based JWT to work across origins, **all
three** must be true simultaneously:

1. **Server CORS:** `origin` must include the _exact_ requesting origin, and
   `credentials: true`.

   ```js
   // Backend/index.js
   app.use(
     cors({
       origin: [
         "https://localhost:5173",
         process.env.CLIENT_URL, // e.g. https://your-frontend.onrender.com
       ].filter(Boolean),
       credentials: true,
     }),
   );
   ```

2. **Client:** `withCredentials: true` on every axios call (already present in
   [`Frontend/src/api/website.js`](Frontend/src/api/website.js)).

3. **Cookie:** `sameSite: "none"` + `secure: true` when cross-site (fixed in
   `auth.controller.js`).

> If **any one** is missing, the browser blocks the cookie and you get a 401
> (not a 500). Since this case is a 500, CORS is _not_ the blocker — but these
> settings are now hardened so a future 401 doesn't appear.

### 4.2 CORS vs. 500 — How to Tell the Difference

| Symptom                                     | Likely cause                                          |
| ------------------------------------------- | ----------------------------------------------------- |
| Browser console: `CORS error` + no response | CORS `origin` missing / `credentials` false           |
| `401 Unauthorized` from server              | Cookie not sent (sameSite/secure mismatch)            |
| `500 Internal Server Error` from server     | **Server-side crash** (this case) — check Render logs |

### 4.3 Preflight (`OPTIONS`) Handling

The CORS middleware handles preflight automatically for the listed methods
(`GET, POST, PUT, DELETE, OPTIONS`). No manual `OPTIONS` route is needed.

---

## 5. Process-Level Safety Nets

On Render, an unhandled rejection silently kills the process with no useful log.
Two handlers were added to [`Backend/index.js`](Backend/index.js):

```js
process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
  process.exit(1); // Render restarts a clean instance
});
```

---

## 6. How to Verify the Fix

### 6.1 Check the Render Logs

After deploying, open Render → your service → **Logs**. You should now see:

```
🔌 Connecting to MongoDB...
✅ Database connected successfully
✅ MongoDB ready, starting HTTP server...
🚀 Production Server is running on port 10000
[INFO] 2026-07-14T10:55:00Z GET /api/website/website/6a5609ef8fea16946d0c6e9f → 200 (42ms)
```

If the 500 recurs, the log will now show the **full structured error**:

```
🔥 SERVER ERROR: {
  "timestamp": "2026-07-14T10:55:00Z",
  "method": "GET",
  "url": "/api/website/website/6a5609ef8fea16946d0c6e9f",
  "status": 500,
  "errorName": "MongooseError",
  "message": "Operation buffering timed out...",
  "stack": "..."
}
```

### 6.2 Reproduce Locally

```bash
# 1. Start the backend (HTTPS local)
cd Backend && npm start

# 2. In another terminal, hit the health endpoints
curl -k https://localhost:3000/health
curl -k https://localhost:3000/health/db

# 3. Reproduce the failing request (replace TOKEN with a real JWT)
curl -k -H "Cookie: token=<YOUR_JWT>" \
  https://localhost:3000/api/website/website/6a5609ef8fea16946d0c6e9f
```

### 6.3 Test the Invalid-ID Path

```bash
# Should now return 400 (not 500) with a clear message
curl -k -H "Cookie: token=<YOUR_JWT>" \
  https://localhost:3000/api/website/website/not-a-valid-id
# → {"success":false,"statusCode":400,"message":"Invalid website ID"}
```

---

## 7. Summary of Changes

| File                                                                                     | Change                                                                                                         |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`Backend/config/db.js`](Backend/config/db.js)                                           | Awaitable `connectDB()` singleton; connection-event logging; fail-fast options                                 |
| [`Backend/middleware/errorHandler.js`](Backend/middleware/errorHandler.js)               | New: structured error logging + Mongoose→HTTP status mapping + 404 handler                                     |
| [`Backend/index.js`](Backend/index.js)                                                   | Await DB before listen; request logging; `/health` + `/health/db`; process safety nets; wire new error handler |
| [`Backend/controllers/website.controller.js`](Backend/controllers/website.controller.js) | `getWebsiteById` validates ObjectId before querying (400 not 500)                                              |
| [`Backend/controllers/auth.controller.js`](Backend/controllers/auth.controller.js)       | Fixed `secure` tautology; aligned set/clear cookie options                                                     |

### Root Causes Addressed

1. **Opaque 500** — error handler logged nothing → now logs full structured trace.
2. **CastError → 500** — invalid ObjectId → now validated → clean 400.
3. **Buffering timeout → 500** — server listened before DB connected → now awaits.
4. **Silent process crashes** — unhandled rejections → now caught and logged.
5. **Cookie `secure` tautology** — always `true` broke local HTTP → now env-aware.
