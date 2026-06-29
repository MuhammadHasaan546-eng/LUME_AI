import { getRedirectResult } from "firebase/auth";
import { auth } from "@/config/firebase";
import { login } from "@/api/auth";
import store from "@/store/store";
import { toast } from "sonner";

// Tracks whether we've already processed a redirect result on this page load
// so concurrent callers share a single in-flight promise.
let redirectPromise = null;

/**
 * Process the Firebase sign-in redirect result.
 *
 * After signInWithRedirect navigates the user to Google and back, Firebase
 * stores the credential. This function calls getRedirectResult() to retrieve
 * it, extracts the user data, and dispatches the login thunk to our backend
 * so the user is created/stored in MongoDB and a JWT cookie is set.
 *
 * This is safe to call on every page load — if there's no pending redirect
 * result (e.g. normal navigation), it resolves to null and does nothing.
 *
 * Returns a promise that resolves to the dispatched login action result, or
 * null if there was no redirect result to process.
 */
export const handleRedirectResult = async () => {
  // Reuse an in-flight promise so concurrent callers don't stack up calls.
  if (redirectPromise) return redirectPromise;

  redirectPromise = (async () => {
    try {
      const result = await getRedirectResult(auth);

      // No pending redirect result — normal page load, nothing to do.
      if (!result || !result.user) return null;

      const userData = {
        email: result.user.email,
        name:
          result.user.displayName || result.user.email?.split("@")[0] || "User",
        avatar: result.user.photoURL || "",
      };

      // Send the Firebase user to our backend to create/login + set JWT cookie.
      const res = await store.dispatch(login(userData));

      if (login.fulfilled.match(res)) {
        toast.success("Logged in successfully!");
      } else {
        toast.error(res.payload || "Failed to log in.");
      }

      return res;
    } catch (error) {
      console.error("Redirect result error:", error);

      // Firebase config / unauthorized domain errors
      if (error?.code === "auth/configuration-not-found") {
        toast.error(
          "Firebase configuration not found. The API key in Frontend/.env does not match the Firebase project. Update VITE_FIREBASE_API_KEY with the key from Firebase Console → Project Settings.",
        );
      } else if (
        error?.code === "auth/api-key-not-valid" ||
        error?.code === "auth/invalid-api-key"
      ) {
        toast.error("Firebase API key is invalid. Check your .env file.");
      } else if (error?.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized in Firebase console.");
      } else {
        toast.error(error?.message || "Failed to log in.");
      }

      return null;
    } finally {
      redirectPromise = null;
    }
  })();

  return redirectPromise;
};

export default handleRedirectResult;
