import User from "../models/User.models.js";
import { googleAuthValidation } from "../validations/user.validation.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import wrapAsync from "../utils/wrapAsync.js";

// Cookie options shared by both the JSON login (googleAuth) and the OAuth
// redirect callback (googleCallback) so the token is stored identically.
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT expiry
};

// Frontend URL to redirect to after a successful OAuth callback.
// Falls back to the dev server origin if unset.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/**
 * Create or look up a user from a Google profile and return a signed JWT.
 * Shared by googleAuth (JSON body) and googleCallback (OAuth code exchange).
 */
const upsertUserFromGoogle = async ({ name, email, avatar }) => {
  let user = await User.findOne({ email });
  let isNewUser = false;
  if (!user) {
    user = new User({ name, email, avatar });
    await user.save();
    isNewUser = true;
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return { user, token, isNewUser };
};

export const googleAuth = wrapAsync(async (req, res) => {
  console.log(req.body);
  const validation = googleAuthValidation.validate(req.body);
  if (validation.error) {
    throw new ExpressError(validation.error.details[0].message, 400);
  }
  const { user, token, isNewUser } = await upsertUserFromGoogle(req.body);

  res.cookie("token", token, AUTH_COOKIE_OPTIONS);

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

/**
 * Google OAuth 2.0 redirect callback.
 *
 * Flow:
 *   1. LoginModal.jsx sends the browser to Google's consent screen with
 *      redirect_uri = GOOGLE_OAUTH_REDIRECT_URI.
 *   2. Google redirects back here with ?code=... (or ?error=... if the user
 *      cancelled).
 *   3. We exchange the `code` for tokens using the googleapis library.
 *   4. We read the user's Google profile (id, email, name, avatar) from the
 *      id_token / userinfo endpoint.
 *   5. We upsert the user in MongoDB and sign a JWT, stored in an httpOnly
 *      cookie (same as googleAuth).
 *   6. We redirect the browser back to the frontend. The frontend's authLoader
 *      then calls GET /api/user/me (with the cookie) to hydrate Redux.
 *
 * Errors are surfaced to the user by redirecting to the frontend with a
 * ?auth_error=... query param, which the frontend reads and toasts.
 */
export const googleCallback = wrapAsync(async (req, res) => {
  const { code, error } = req.query;

  // User cancelled the consent screen (Google sends ?error=access_denied).
  if (error) {
    return res.redirect(
      `${CLIENT_URL}/login?auth_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return res.redirect(
      `${CLIENT_URL}/login?auth_error=${encodeURIComponent("missing_code")}`,
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );

  // Exchange the authorization code for access + id tokens.
  // Throws on invalid/expired code, wrong redirect_uri, or wrong client secret.
  let tokens;
  try {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (err) {
    console.error(
      "[googleCallback] code exchange failed:",
      err?.message || err,
    );
    return res.redirect(
      `${CLIENT_URL}/login?auth_error=${encodeURIComponent("code_exchange_failed")}`,
    );
  }

  if (!tokens?.id_token) {
    console.error("[googleCallback] no id_token in token response");
    return res.redirect(
      `${CLIENT_URL}/login?auth_error=${encodeURIComponent("no_id_token")}`,
    );
  }

  // Verify + decode the id_token to get the user's profile. verifyIdToken
  // checks the signature and audience (client_id) for us.
  let payload;
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error(
      "[googleCallback] id_token verification failed:",
      err?.message || err,
    );
    return res.redirect(
      `${CLIENT_URL}/login?auth_error=${encodeURIComponent("invalid_id_token")}`,
    );
  }

  const email = payload?.email;
  if (!email) {
    return res.redirect(
      `${CLIENT_URL}/login?auth_error=${encodeURIComponent("no_email_in_profile")}`,
    );
  }

  const { user, token, isNewUser } = await upsertUserFromGoogle({
    name:
      payload.name ||
      payload.given_name ||
      payload.email?.split("@")[0] ||
      "User",
    email,
    avatar: payload.picture || "",
  });

  res.cookie("token", token, AUTH_COOKIE_OPTIONS);

  console.log(
    `[googleCallback] ${isNewUser ? "Created" : "Logged in"} user ${user.email}`,
  );

  // Redirect to the dashboard (protected route). authLoader will call
  // /api/user/me with the cookie we just set and hydrate Redux.
  return res.redirect(`${CLIENT_URL}/dashboard`);
});
export const logout = wrapAsync(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
