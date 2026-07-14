import { getCurrentUser } from "@/api/getUser";
import store from "@/store/store";

// Track in-flight requests so concurrent route loaders share one fetch.
let inflight = null;

/**
 * Route loader middleware that re-fetches the current user on refresh.
 * This prevents automatic logout when a user refreshes a page.
 *
 * Deduplicates requests: if a fetch is already in-flight (e.g. multiple
 * loaders run at once) or the user is already loaded in the store, it
 * skips re-fetching to avoid infinite request loops.
 *
 * Usage in AppRouter:
 *   {
 *     path: "pricing",
 *     element: <Price />,
 *     loader: authLoader,
 *   }
 */
export const authLoader = async () => {
  const { isAuthenticated, user } = store.getState().auth;

  // If we already have an authenticated user in the store, no need to refetch.
  // This prevents the repeated /api/user/me calls on every route navigation.
  if (isAuthenticated && user) {
    return null;
  }

  // Reuse an in-flight request so concurrent loaders don't stack up calls.
  if (!inflight) {
    inflight = store
      .dispatch(getCurrentUser())
      .unwrap()
      .catch((error) => {})
      .finally(() => {
        inflight = null;
      });
  }

  await inflight;
  return null;
};

export default authLoader;
