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

function mapAIServiceError(error) {
  const message = error?.message || "AI generation failed. Please try again.";

  if (/user not found|invalid api key|unauthorized|forbidden/i.test(message)) {
    return new ExpressError(`OpenRouter error: ${message}`, 502);
  }

  return new ExpressError(message, 502);
}

// export const generateDemo = async (req, res) => {
//   try {
//     const aiResponse = await generateAIResponse("Hellow");
//     if (!aiResponse) {
//       throw new ExpressError("AI response not found", 404);
//     }
//     console.log(aiResponse);
//     return res.status(200).json(new ApiResponse(200, aiResponse));
//   } catch (error) {
//     console.log("api responsive error", error);
//   }
// };
const masterPrompt = `
YOU ARE A PRINCIPAL FRONTEND ARCHITECT
AND A SENIOR UI/UX ENGINEER
SPECIALIZED IN RESPONSIVE DESIGN SYSTEMS.

YOU BUILD HIGH-END, REAL-WORLD, PRODUCTION-GRADE WEBSITES
USING ONLY HTML, CSS, AND JAVASCRIPT
THAT WORK PERFECTLY ON ALL SCREEN SIZES.

THE OUTPUT MUST BE CLIENT-DELIVERABLE WITHOUT ANY MODIFICATION.

❌ NO FRAMEWORKS
❌ NO LIBRARIES
❌ NO BASIC SITES
❌ NO PLACEHOLDERS
❌ NO NON-RESPONSIVE LAYOUTS

--------------------------------------------------
USER REQUIREMENT:
{USER_PROMPT}
--------------------------------------------------

GLOBAL QUALITY BAR (NON-NEGOTIABLE)
--------------------------------------------------
- Premium, modern UI (2026–2027)
- Professional typography & spacing
- Clean visual hierarchy
- Business-ready content (NO lorem ipsum)
- Smooth transitions & hover effects
- SPA-style multi-page experience
- Production-ready, readable code

--------------------------------------------------
RESPONSIVE DESIGN (ABSOLUTE REQUIREMENT)
--------------------------------------------------
THIS WEBSITE MUST BE FULLY RESPONSIVE.

YOU MUST IMPLEMENT:

✔ Mobile-first CSS approach
✔ Responsive layout for:
  - Mobile (<768px)
  - Tablet (768px–1024px)
  - Desktop (>1024px)

✔ Use:
  - CSS Grid / Flexbox
  - Relative units (%, rem, vw)
  - Media queries

✔ REQUIRED RESPONSIVE BEHAVIOR:
  - Navbar collapses / stacks on mobile
  - Sections stack vertically on mobile
  - Multi-column layouts become single-column on small screens
  - Images scale proportionally
  - Text remains readable on all devices
  - No horizontal scrolling on mobile
  - Touch-friendly buttons on mobile

IF THE WEBSITE IS NOT RESPONSIVE → RESPONSE IS INVALID.

--------------------------------------------------
IMAGES (MANDATORY & RESPONSIVE)
--------------------------------------------------
- Use high-quality images ONLY from:
  https://images.unsplash.com/
- EVERY image URL MUST include:
  ?auto=format&fit=crop&w=1200&q=80

- Images must:
  - Be responsive (max-width: 100%)
  - Resize correctly on mobile
  - Never overflow containers

--------------------------------------------------
TECHNICAL RULES (VERY IMPORTANT)
--------------------------------------------------
- Output ONE single HTML file
- Exactly ONE <style> tag
- Exactly ONE <script> tag
- NO external CSS / JS / fonts
- Use system fonts only
- iframe srcdoc compatible
- SPA-style navigation using JavaScript
- No page reloads
- No dead UI
- No broken buttons
--------------------------------------------------
SPA VISIBILITY RULE (MANDATORY)
--------------------------------------------------
- Pages MUST NOT be hidden permanently
- If .page { display: none } is used,
  then .page.active { display: block } is REQUIRED
- At least ONE page MUST be visible on initial load
- Hiding all content is INVALID


--------------------------------------------------
REQUIRED SPA PAGES
--------------------------------------------------
- Home
- About
- Services / Features
- Contact

--------------------------------------------------
FUNCTIONAL REQUIREMENTS
--------------------------------------------------
- Navigation must switch pages using JS
- Active nav state must update
- Forms must have JS validation
- Buttons must show hover + active states
- Smooth section/page transitions

--------------------------------------------------
FINAL SELF-CHECK (MANDATORY)
--------------------------------------------------
BEFORE RESPONDING, ENSURE:

1. Layout works on mobile, tablet, desktop
2. No horizontal scroll on mobile
3. All images are responsive
4. All sections adapt properly
5. Media queries are present and used
6. Navigation works on all screen sizes
7. At least ONE page is visible without user interaction

IF ANY CHECK FAILS → RESPONSE IS INVALID

--------------------------------------------------
OUTPUT FORMAT (RAW JSON ONLY)
--------------------------------------------------
{
  "message": "Short professional confirmation sentence",
  "code": "<FULL VALID HTML DOCUMENT>"
}

--------------------------------------------------
ABSOLUTE RULES
--------------------------------------------------
- RETURN RAW JSON ONLY
- NO markdown
- NO explanations
- NO extra text
- FORMAT MUST MATCH EXACTLY
- IF FORMAT IS BROKEN → RESPONSE IS INVALID
`;

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

  let parsedResponse = { message: "Website generated successfully", code: "" };

  try {
    // 1. Pehle normal parsing try karein
    parsedResponse = parseAIWebsiteResponse(aiResponse);
  } catch (e) {
    console.warn(
      "Standard parsing failed, applying robust regex cleanup...",
      e,
    );

    // 2. FALLBACK SAFETAEY: Agar standard parse fail ho jaye, toh raw text se HTML nikalein
    let cleanText = aiResponse.trim();

    // Markdown syntax saaf karein (```json ... ``` ya ```html ... ```)
    if (cleanText.startsWith("```")) {
      cleanText = cleanText
        .replace(/^```[a-zA-Z]*\n/, "")
        .replace(/\n```$/, "")
        .trim();
    }

    // Agar pure JSON text ke andar object form mein code aaya hai
    if (cleanText.includes('"code":') || cleanText.includes("'code':")) {
      try {
        const directJson = JSON.parse(cleanText);
        parsedResponse.code = directJson.code;
        if (directJson.message) parsedResponse.message = directJson.message;
      } catch (innerError) {
        // Agar JSON parse ab bhi fail ho, toh direct string ko hi code maan lein
        parsedResponse.code = cleanText;
      }
    } else {
      // Agar AI ne bina JSON format ke direct code bhej diya hai
      parsedResponse.code = cleanText;
    }
  }

  // Double check ke code empty na ho
  if (!parsedResponse.code || parsedResponse.code.trim() === "") {
    throw new ExpressError(
      "AI response was empty or invalid. Please try again.",
      502,
    );
  }

  try {
    // Unique slug generator
    const slug =
      parsedResponse.message
        .slice(0, 60)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    // Database mein website entry create karein
    const website = await Website.create({
      user: req.user.id,
      title: parsedResponse.message.slice(0, 100), // Safety check string length
      slug,
      latestCode: parsedResponse.code,
      conversations: [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "ai",
          content: parsedResponse.message,
        },
      ],
    });

    // Credits minus aur save karein
    user.credits -= GENERATE_COST;
    await user.save();

    // Clean JSON Object response bhejain frontend ko
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          websiteId: website._id,
          latestCode: website.latestCode, // Yeh ab bilkul saaf HTML/Code string hogi
          title: website.title,
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

  // Fallback parsing object initialize karein
  let parsedResponse = { message: "Website updated successfully", code: "" };

  try {
    // 1. Pehle standard JSON parsing check karein
    parsedResponse = parseAIWebsiteResponse(aiResponse);
  } catch (e) {
    console.warn(
      "Standard parsing failed on update, applying robust cleanup...",
      e,
    );

    // 2. FALLBACK LAYER: Markdown aur raw strings saaf karein
    let cleanText = aiResponse.trim();

    if (cleanText.startsWith("```")) {
      cleanText = cleanText
        .replace(/^```[a-zA-Z]*\n/, "")
        .replace(/\n```$/, "")
        .trim();
    }

    // Agar direct code key mojood hai text mein
    if (cleanText.includes('"code":') || cleanText.includes("'code':")) {
      try {
        const directJson = JSON.parse(cleanText);
        parsedResponse.code = directJson.code;
        if (directJson.message) parsedResponse.message = directJson.message;
      } catch (innerError) {
        parsedResponse.code = cleanText;
      }
    } else {
      // Agar direct code/HTML string bhej di hai AI ne
      parsedResponse.code = cleanText;
    }
  }

  // Safety Check: Code khali nahi hona chahiye
  if (!parsedResponse.code || parsedResponse.code.trim() === "") {
    throw new ExpressError(
      "AI updated code was empty or invalid. Please try again.",
      502,
    );
  }

  try {
    // Website document update karein
    website.title = parsedResponse.message.slice(0, 100);
    website.latestCode = parsedResponse.code; // Yeh ab guaranteed clean code/HTML hoga

    website.conversations.push(
      { role: "user", content: prompt },
      { role: "ai", content: parsedResponse.message },
    );
    await website.save();

    // User credits deduct karein
    user.credits -= UPDATE_COST;
    await user.save();

    // Sahi clean object frontend ko return karein
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          websiteId: website._id,
          title: website.title,
          latestCode: website.latestCode,
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
export const getUserWebsites = wrapAsync(async (req, res) => {
  const websites = await Website.find({ user: req.user.id })
    .select("title slug latestCode deployed deployedUrl createdAt updatedAt")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, websites));
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

// Extract the first <img src="..."> URL from an HTML string.
// Used to generate a lightweight thumbnail for the public showcase
// without sending the full (heavy) latestCode to the frontend.
function extractThumbnailFromCode(html = "") {
  if (!html) return "";

  // Match the first <img ... src="..." ...> occurrence (single/double quotes)
  const imgMatch = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  // Fallback: try to find an OpenGraph og:image meta tag
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  );
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1];
  }

  return "";
}

// PUBLIC endpoint — returns all deployed websites for the showcase gallery.
// No authentication required. Only lightweight metadata is returned
// (title, slug, deployedUrl, thumbnail, createdAt + creator name/avatar).
export const getShowcaseWebsites = wrapAsync(async (req, res) => {
  const websites = await Website.find({ deployed: true })
    .populate("user", "name avatar")
    .select("title slug deployedUrl latestCode createdAt user")
    .sort({ createdAt: -1 });

  // Map to a lightweight payload — strip the heavy latestCode and
  // expose only a thumbnail image URL extracted from the HTML.
  const showcase = websites.map((w) => ({
    _id: w._id,
    title: w.title,
    slug: w.slug,
    deployedUrl: w.deployedUrl,
    thumbnail: extractThumbnailFromCode(w.latestCode),
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
    "title latestCode deployed deployedUrl slug updatedAt",
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
  const { code } = req.body || {};

  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ExpressError("Website not found", 404);
  }

  if (website.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  if (typeof code === "string" && code.trim()) {
    website.latestCode = code;
  }

  if (!website.slug) {
    website.slug =
      website.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      websiteId +
      Date.now();
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
        latestCode: website.latestCode,
        deployed: website.deployed,
        deployedUrl: website.deployedUrl,
        updatedAt: website.updatedAt,
      },
      "Website deployed successfully",
    ),
  );
});
