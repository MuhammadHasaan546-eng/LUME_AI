import generateAIResponse from "../config/openRouter.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import wrapAsync from "../utils/wrapAsync.js";
import Website from "../models/website.models.js";
import User from "../models/User.models.js";

const GENERATE_COST = 50;
const UPDATE_COST = 25;

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

  const aiResponse = await generateAIResponse(finalPrompt);
  if (!aiResponse) {
    throw new ExpressError("AI response not found", 404);
  }
  let parsedResponse = aiResponse;
  try {
    // Some models wrap JSON in markdown blocks, so clean it up before parsing
    const cleanJsonString = aiResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    parsedResponse = JSON.parse(cleanJsonString);
    console.log(parsedResponse);

    const slug =
      parsedResponse.message
        .slice(0, 60)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    await Website.create({
      user: req.user.id,
      title: parsedResponse.message,
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

    user.credits -= GENERATE_COST;
    await user.save();
  } catch (e) {
    console.warn("Failed to parse AI response as JSON", e);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        websiteId: Website._id,
        latestCode: Website.latestCode,
        title: Website.title,
        createdAt: Website.createdAt,
        credits: user.credits,
      },
      "Website generated successfully",
    ),
  );
});

export const updateWebsite = wrapAsync(async (req, res) => {
  const { websiteId, prompt } = req.body;

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

  const aiResponse = await generateAIResponse(finalPrompt);
  if (!aiResponse) {
    throw new ExpressError("AI response not found", 404);
  }

  let parsedResponse = aiResponse;
  try {
    const cleanJsonString = aiResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    parsedResponse = JSON.parse(cleanJsonString);

    website.title = parsedResponse.message;
    website.latestCode = parsedResponse.code;
    website.conversations.push(
      { role: "user", content: prompt },
      { role: "ai", content: parsedResponse.message },
    );
    await website.save();

    user.credits -= UPDATE_COST;
    await user.save();
  } catch (e) {
    console.warn("Failed to parse AI response as JSON", e);
  }

  return res.status(200).json(new ApiResponse(200, parsedResponse));
});

export const getUserWebsites = wrapAsync(async (req, res) => {
  const websites = await Website.find({ user: req.user.id })
    .select("title slug deployed deployedUrl createdAt updatedAt")
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
