/**
 * Editer.jsx — Thin page wrapper for the reusable <Editor /> component.
 *
 * Responsibilities (page-level only — no UI/markup here):
 *   1. Read the `:codeId` route param and load the website via Redux.
 *   2. Pull `pageData`, `conversations`, `title`, and loading flags from the
 *      website slice.
 *   3. Wire the Editor's callback props to Redux thunks:
 *        onPageDataChange → debounced savePageData
 *        onPrompt         → updateWebsite (AI iterative generation)
 *        onDeploy         → deployWebsite
 *   4. Bridge the theme store (selectedTheme / resolvedTheme).
 *
 * All editor UI, section management, Canvas, and WebContainer logic lives in
 * the presentational <Editor /> component so it can be mounted anywhere.
 */
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import Editor from "@/components/client/Editor";
import {
  deployWebsite,
  getWebsiteById,
  savePageData,
  updateWebsite,
} from "@/api/website";
import { setPageData } from "@/store/website";
import { setThemePreference } from "@/store/theme";

const AUTOSAVE_DEBOUNCE_MS = 1200;

const EditorPage = () => {
  const navigate = useNavigate();
  const { codeId } = useParams();
  const dispatch = useDispatch();

  const { pageData, currentWebsite, isLoading, isSaving, saveError } =
    useSelector((state) => state.website);
  const { selectedTheme, resolvedTheme } = useSelector((state) => state.theme);
  const isDark = resolvedTheme === "dark";

  /* ── Load the website workspace on mount / id change ────────────────── */
  useEffect(() => {
    if (!codeId) return;
    dispatch(getWebsiteById(codeId))
      .unwrap()
      .catch((err) => {
        toast.error(err || "Failed to load website workspace.");
      });
  }, [codeId, dispatch]);

  /* ── Debounced autosave ────────────────────────────────────────────────
     When the Editor reports a pageData change we optimistically push it into
     Redux (so other tabs/components see it immediately) and then debounce the
     network save. The latest pageData is captured in a ref so the timer
     always fires with the most recent value. */
  const latestPageDataRef = useRef(null);
  const saveTimerRef = useRef(null);

  const handlePageDataChange = useCallback(
    (nextPageData) => {
      // Optimistic local update — no network round-trip.
      dispatch(setPageData(nextPageData));
      latestPageDataRef.current = nextPageData;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const data = latestPageDataRef.current;
        if (!data || !codeId) return;
        dispatch(savePageData({ websiteId: codeId, pageData: data }))
          .unwrap()
          .catch((err) => {
            toast.error(err || "Autosave failed.");
          });
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [codeId, dispatch],
  );

  // Flush pending save on unmount.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        const data = latestPageDataRef.current;
        if (data && codeId) {
          dispatch(savePageData({ websiteId: codeId, pageData: data }));
        }
      }
    };
  }, [codeId, dispatch]);

  /* ── AI iterative generation ─────────────────────────────────────────── */
  const handlePrompt = useCallback(
    async (promptText) => {
      if (!codeId) return;
      const response = await dispatch(
        updateWebsite({ websiteId: codeId, prompt: promptText }),
      ).unwrap();
      toast.success(response.message || "Canvas layout synchronized!");
      return response;
    },
    [codeId, dispatch],
  );

  /* ── Deploy ──────────────────────────────────────────────────────────── */
  const handleDeploy = useCallback(
    async (dataToDeploy) => {
      if (!codeId) return;
      const response = await dispatch(
        deployWebsite({ websiteId: codeId, pageData: dataToDeploy }),
      ).unwrap();
      const liveUrl = response.data?.deployedUrl || `/live-site/${codeId}`;
      toast.success(response.message || "Website deployed successfully.");
      navigate(liveUrl.replace(window.location.origin, ""));
    },
    [codeId, dispatch, navigate],
  );

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const handleBack = useCallback(() => navigate("/dashboard"), [navigate]);

  const handleThemeChange = useCallback(
    (theme) => dispatch(setThemePreference(theme)),
    [dispatch],
  );

  /* ── Surface save errors as toasts ───────────────────────────────────── */
  useEffect(() => {
    if (saveError) toast.error(saveError);
  }, [saveError]);

  const conversations = currentWebsite?.conversations || [];
  const title = currentWebsite?.title || "Untitled Project";

  return (
    <Editor
      initialPageData={pageData}
      onPageDataChange={handlePageDataChange}
      title={title}
      conversations={conversations}
      onPrompt={handlePrompt}
      onDeploy={handleDeploy}
      onBack={handleBack}
      isLoading={isLoading}
      isSaving={isSaving}
      selectedTheme={selectedTheme}
      onThemeChange={handleThemeChange}
      isDark={isDark}
    />
  );
};

export default EditorPage;
