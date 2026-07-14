/**
 * ============================================================================
 * CodeWorkspace — Page wrapper for the IDE-style <CodeEditor /> component
 * ============================================================================
 *
 * Responsibilities (page-level only — no UI/markup here):
 *   1. Read the optional `:codeId` route param. When present, load the
 *      website via Redux so the WebContainer boots with that project's
 *      pageData. When absent, the CodeEditor boots a default project.
 *   2. Pull `pageData` and `currentWebsite` from the website slice.
 *   3. Wire the back-navigation handler.
 *
 * All IDE UI, file explorer, Monaco editor, and terminal logic lives in the
 * presentational <CodeEditor /> component so it can be mounted anywhere.
 */
import { useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import CodeEditor from "@/components/client/CodeEditor";
import { getWebsiteById } from "@/api/website";

const CodeWorkspacePage = () => {
  const navigate = useNavigate();
  const { codeId } = useParams();
  const dispatch = useDispatch();

  const { pageData, currentWebsite } = useSelector((state) => state.website);

  /* ── Load the website workspace on mount / id change ────────────────── */
  useEffect(() => {
    if (!codeId) return;
    dispatch(getWebsiteById(codeId))
      .unwrap()
      .catch((err) => {
        toast.error(err || "Failed to load website workspace.");
      });
  }, [codeId, dispatch]);

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const handleBack = useCallback(() => navigate("/dashboard"), [navigate]);

  const title = currentWebsite?.title || "Code Workspace";

  return (
    <CodeEditor
      initialPageData={codeId ? pageData : null}
      title={title}
      onBack={handleBack}
    />
  );
};

export default CodeWorkspacePage;
