import generateAIResponse, {
  parseAIWebsiteResponse,
} from "../config/openRouter.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import wrapAsync from "../utils/wrapAsync.js";
import Website from "../models/website.models.js";
import User from "../models/User.models.js";

const GENERATE_COST = 50;
const UPDATE_COST = 25;
// Saving page data (manual editor edits) is free — it is not an AI call.
const SAVE_PAGE_DATA_COST = 0;

function mapAIServiceError(error) {
  const message = error?.message || "AI generation failed. Please try again.";

  if (/user not found|invalid api key|unauthorized|forbidden/i.test(message)) {
    return new ExpressError(`OpenRouter error: ${message}`, 502);
  }

  return new ExpressError(message, 502);
}

/**
 * masterPrompt is appended to the user message sent to the AI. The full
 * pageData schema and section-type rules live in the SYSTEM prompt inside
 * tryModel() (see Backend/config/openRouter.js). This prompt focuses on the
 * user's requirement, the quality bar, and the output-format contract.
 *
 * The AI must return a JSON object: { message, pageData }. It must NOT return
 * HTML or React code — the pageData is rendered by a pre-built React component
 * system on the frontend.
 */
const masterPrompt = `
YOU ARE A PRINCIPAL FRONTEND ARCHITECT AND A SENIOR UI/UX ENGINEER
SPECIALIZED IN MODERN, CONVERSION-FOCUSED LANDING PAGES.

You generate STRUCTURED website definitions as a JSON "pageData" object.
The pageData is the Single Source of Truth — it is rendered by a pre-built
React component system (Hero, Features, Stats, Gallery, Testimonials,
Pricing, CTA, Contact). You NEVER output HTML, React code, or markdown.
You ONLY output a JSON object.

--------------------------------------------------
USER REQUIREMENT:
{USER_PROMPT}
--------------------------------------------------

GLOBAL QUALITY BAR (NON-NEGOTIABLE)
- Premium, modern UI (2026–2027 aesthetic)
- Professional typography, spacing, and visual hierarchy
- Business-ready, realistic content (NO lorem ipsum, NO placeholders)
- Fully responsive intent (the component system handles responsiveness,
  but choose layouts and content that work on mobile, tablet, and desktop)
- Accessible semantics (the components are pre-built accessible)

--------------------------------------------------
CONTENT RULES
- Use realistic business content tailored to the user's request
- Use Unsplash image URLs for ALL images, each ending with:
    ?auto=format&fit=crop&w=1200&q=80
- Give every section a unique, descriptive "id" string (e.g. "hero-main",
  "features-grid", "pricing-plans")
- Pick the most appropriate section types for the request. A typical
  landing page uses: hero → features → stats → testimonials → pricing → cta
  (do NOT use every type if it does not fit; 4–7 sections is ideal)
- Keep the JSON compact so it fits within the token limit

--------------------------------------------------
OUTPUT FORMAT (RAW JSON ONLY)
{
  "message": "Short professional confirmation sentence",
  "pageData": { ...the structured page definition following the schema... }
}

--------------------------------------------------
ABSOLUTE RULES
- RETURN RAW JSON ONLY
- NO markdown fences (no \`\`\`)
- NO explanations, prose, or reasoning
- NO HTML or React code
- The "pageData" object MUST follow the exact schema described in the
  system prompt (schemaVersion, meta, header, sections[], footer)
`;

/**
 * Build a URL-safe slug from a title. Falls back to a timestamp if the
 * title yields no usable characters.
 */
function buildSlug(title, suffixId = "") {
  const base = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${base || "site"}-${suffixId || Date.now().toString(36)}`;
  return slug;
}

/**
 * Extract the first usable image URL from a pageData object, scanning
 * sections in order. Used to generate a lightweight thumbnail for lists
 * (dashboard / showcase) without sending the full pageData to the client.
 */
function extractThumbnailFromPageData(pageData) {
  if (!pageData || typeof pageData !== "object") return "";

  const sections = Array.isArray(pageData.sections) ? pageData.sections : [];

  for (const section of sections) {
    const props = (section && section.props) || {};

    // hero / cta may carry a single image object
    if (props.image && typeof props.image === "object" && props.image.src) {
      return props.image.src;
    }

    // gallery / features / testimonials / pricing carry arrays of items
    const collections = [props.items, props.plans, props.gallery].filter(
      Array.isArray,
    );

    for (const collection of collections) {
      for (const item of collection) {
        if (!item) continue;
        if (item.src) return item.src;
        if (item.avatar) return item.avatar;
        if (item.image && typeof item.image === "object" && item.image.src) {
          return item.image.src;
        }
      }
    }
  }

  return "";
}

export const generateWebSite = wrapAsync(async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    throw new ExpressError("Prompt is required", 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  if (user.credits < GENERATE_COST) {
    throw new ExpressError(
      `Insufficient credits. You have ${user.credits} credits, but generation requires ${GENERATE_COST}.`,
      402,
    );
  }

  const finalPrompt = masterPrompt.replace("{USER_PROMPT}", prompt);

  let aiResponse;
  try {
    aiResponse = await generateAIResponse(finalPrompt);
  } catch (error) {
    throw mapAIServiceError(error);
  }

  if (!aiResponse) {
    throw new ExpressError("AI generation failed. Please try again.", 502);
  }

  // parseAIWebsiteResponse returns { message, pageData } and validates that
  // pageData.sections is an array. The frontend's normalizePageData() is the
  // final safety net for individual section shapes.
  let parsedResponse;
  try {
    parsedResponse = parseAIWebsiteResponse(aiResponse);
  } catch (error) {
    console.warn("AI response parsing failed:", error.message);
    throw new ExpressError(
      "AI response was invalid or did not contain a valid pageData object. Please try again.",
      502,
    );
  }

  const { message, pageData } = parsedResponse;

  if (
    !pageData ||
    typeof pageData !== "object" ||
    !Array.isArray(pageData.sections)
  ) {
    throw new ExpressError(
      "AI response was empty or invalid. Please try again.",
      502,
    );
  }

  try {
    const title = String(
      pageData.meta?.title || message || "Untitled website",
    ).slice(0, 100);

    const slug = buildSlug(title, Date.now().toString(36));

    const website = await Website.create({
      user: req.user.id,
      title,
      slug,
      pageData,
      conversations: [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "ai",
          content: message,
        },
      ],
    });

    // Deduct credits and persist.
    user.credits -= GENERATE_COST;
    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          websiteId: website._id,
          pageData: website.pageData,
          title: website.title,
          slug: website.slug,
          conversations: website.conversations,
          createdAt: website.createdAt,
          credits: user.credits,
        },
        "Website generated successfully",
      ),
    );
  } catch (error) {
    console.error("Database or final compilation error:", error);
    throw new ExpressError(
      "Failed to save generated website context. Please try again.",
      500,
    );
  }
});

export const updateWebsite = wrapAsync(async (req, res) => {
  const { websiteId, prompt } = req.body;

  if (!websiteId || !prompt) {
    throw new ExpressError("Website ID and prompt are required", 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  if (user.credits < UPDATE_COST) {
    throw new ExpressError(
      `Insufficient credits. You have ${user.credits} credits, but modification requires ${UPDATE_COST}.`,
      402,
    );
  }

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (website.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  const finalPrompt = masterPrompt.replace("{USER_PROMPT}", prompt);

  let aiResponse;
  try {
    aiResponse = await generateAIResponse(finalPrompt);
  } catch (error) {
    throw mapAIServiceError(error);
  }

  if (!aiResponse) {
    throw new ExpressError("AI generation failed. Please try again.", 502);
  }

  let parsedResponse;
  try {
    parsedResponse = parseAIWebsiteResponse(aiResponse);
  } catch (error) {
    console.warn("AI response parsing failed on update:", error.message);
    throw new ExpressError(
      "AI updated response was invalid or did not contain a valid pageData object. Please try again.",
      502,
    );
  }

  const { message, pageData } = parsedResponse;

  if (
    !pageData ||
    typeof pageData !== "object" ||
    !Array.isArray(pageData.sections)
  ) {
    throw new ExpressError(
      "AI updated pageData was empty or invalid. Please try again.",
      502,
    );
  }

  try {
    website.title = String(
      pageData.meta?.title || message || website.title,
    ).slice(0, 100);
    website.pageData = pageData;

    website.conversations.push(
      { role: "user", content: prompt },
      { role: "ai", content: message },
    );
    await website.save();

    user.credits -= UPDATE_COST;
    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          websiteId: website._id,
          pageData: website.pageData,
          title: website.title,
          conversations: website.conversations,
          updatedAt: website.updatedAt,
          credits: user.credits,
        },
        "Website updated successfully",
      ),
    );
  } catch (error) {
    console.error("Database saving error during update:", error);
    throw new ExpressError(
      "Failed to save website changes. Please try again.",
      500,
    );
  }
});

/**
 * Persist the editor's current pageData (the Single Source of Truth) for a
 * website. This is NOT an AI call — it is a direct save of the structured
 * JSON the user has been editing in the canvas. Free of charge.
 *
 * Expects: { websiteId, pageData } — validated by savePageDataValidation.
 */
export const savePageData = wrapAsync(async (req, res) => {
  const { websiteId, pageData } = req.body;

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (website.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  if (
    !pageData ||
    typeof pageData !== "object" ||
    !Array.isArray(pageData.sections)
  ) {
    throw new ExpressError("Invalid pageData payload", 400);
  }

  website.pageData = pageData;

  // Keep the title in sync with the page's meta title when present.
  if (pageData.meta && typeof pageData.meta.title === "string") {
    const nextTitle = pageData.meta.title.trim();
    if (nextTitle) {
      website.title = nextTitle.slice(0, 100);
    }
  }

  await website.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        websiteId: website._id,
        pageData: website.pageData,
        title: website.title,
        updatedAt: website.updatedAt,
        credits: SAVE_PAGE_DATA_COST,
      },
      "Page data saved successfully",
    ),
  );
});

export const getUserWebsites = wrapAsync(async (req, res) => {
  const websites = await Website.find({ user: req.user.id })
    .select("title slug pageData deployed deployedUrl createdAt updatedAt")
    .sort({ createdAt: -1 });

  // Map to a lightweight payload — strip the full pageData and expose only a
  // thumbnail image URL extracted from the sections.
  const list = websites.map((w) => ({
    _id: w._id,
    title: w.title,
    slug: w.slug,
    deployed: w.deployed,
    deployedUrl: w.deployedUrl,
    thumbnail: extractThumbnailFromPageData(w.pageData),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));

  return res.status(200).json(new ApiResponse(200, list));
});

export const getWebsiteById = wrapAsync(async (req, res) => {
  const { websiteId } = req.params;

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (website.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  return res.status(200).json(new ApiResponse(200, website));
});

// PUBLIC endpoint — returns all deployed websites for the showcase gallery.
// No authentication required. Only lightweight metadata is returned
// (title, slug, deployedUrl, thumbnail, createdAt + creator name/avatar).
export const getShowcaseWebsites = wrapAsync(async (req, res) => {
  const websites = await Website.find({ deployed: true })
    .populate("user", "name avatar")
    .select("title slug pageData deployedUrl createdAt user")
    .sort({ createdAt: -1 });

  // Map to a lightweight payload — strip the full pageData and expose only a
  // thumbnail image URL extracted from the sections.
  const showcase = websites.map((w) => ({
    _id: w._id,
    title: w.title,
    slug: w.slug,
    deployedUrl: w.deployedUrl,
    thumbnail: extractThumbnailFromPageData(w.pageData),
    createdAt: w.createdAt,
    creator: w.user ? { name: w.user.name, avatar: w.user.avatar } : null,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, showcase, "Showcase websites fetched"));
});

export const getLiveWebsite = wrapAsync(async (req, res) => {
  const { websiteId } = req.params;

  const website = await Website.findById(websiteId).select(
    "title pageData deployed deployedUrl slug updatedAt",
  );
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (!website.deployed) {
    throw new ExpressError("Website is not deployed yet", 404);
  }

  return res.status(200).json(new ApiResponse(200, website));
});

export const deleteWebsite = wrapAsync(async (req, res) => {
  const { websiteId } = req.params;

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (website.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  await Website.findByIdAndDelete(websiteId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Website deleted successfully"));
});

export const deployWebsite = wrapAsync(async (req, res) => {
  const { websiteId } = req.params;
  const { pageData } = req.body || {};

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (website.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  // If the client sends the latest pageData at deploy time, persist it so the
  // live site always reflects the user's most recent editor state.
  if (
    pageData &&
    typeof pageData === "object" &&
    Array.isArray(pageData.sections)
  ) {
    website.pageData = pageData;
    if (pageData.meta && typeof pageData.meta.title === "string") {
      const nextTitle = pageData.meta.title.trim();
      if (nextTitle) website.title = nextTitle.slice(0, 100);
    }
  }

  if (!website.slug) {
    website.slug = buildSlug(website.title, websiteId);
  }

  const hostingBaseUrl =
    process.env.HOSTING_BASE_URL || "http://localhost:5173";

  website.deployed = true;
  website.deployedUrl = `${hostingBaseUrl}/live-site/${website._id}`;
  await website.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        websiteId: website._id,
        title: website.title,
        pageData: website.pageData,
        deployed: website.deployed,
        deployedUrl: website.deployedUrl,
        updatedAt: website.updatedAt,
      },
      "Website deployed successfully",
    ),
  );
});
