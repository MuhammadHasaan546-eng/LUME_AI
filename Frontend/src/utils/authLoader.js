import { getCurrentUser } from "@/api/getUser";
import store from "@/store/store";

/**
 * Route loader middleware that re-fetches the current user on refresh.
 * This prevents automatic logout when a user refreshes a page.
 *
 * Usage in AppRouter:
 *   {
 *     path: "pricing",
 *     element: <Price />,
 *     loader: authLoader,
 *   }
 */
export const authLoader = async () => {
  try {
    await store.dispatch(getCurrentUser()).unwrap();
  } catch (error) {
    console.log("User not logged in", error);
  }
  return null;
};

export default authLoader;
