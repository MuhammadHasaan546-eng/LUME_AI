// ── OpenRouter API (proxies to multiple AI models) ──
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FETCH_TIMEOUT_MS = 120_000;

function getOpenRouterApiKey() {
  return (
    process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_API_KEY || null
  );
}

function normalizeFatalOpenRouterMessage(message) {
  if (/user not found/i.test(message)) {
    return (
      "OpenRouter rejected the configured API key with 'User not found'. " +
      "Check that your backend .env contains a valid OpenRouter key under " +
      "OPEN_ROUTER_API_KEY or OPENROUTER_API_KEY."
    );
  }

  return message;
}

// Use one model consistently so generation behavior is predictable.
const ACTIVE_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

function extractJsonObject(text) {
  if (typeof text !== "string") {
    throw new Error("AI response is not text");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response does not contain a JSON object");
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      const rawCode = extractJsonStringField(cleaned, "code");
      if (rawCode) {
        return {
          message:
            extractJsonStringField(cleaned, "message") ||
            "Website generated successfully",
          code: decodeJsonEscapes(rawCode),
        };
      }
      throw new Error("AI response does not contain a parseable JSON object");
    }
  }
}

function extractJsonStringField(text, fieldName) {
  const marker = `"${fieldName}"`;
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return "";

  const colonIndex = text.indexOf(":", markerIndex + marker.length);
  if (colonIndex === -1) return "";

  let quoteIndex = colonIndex + 1;
  while (/\s/.test(text[quoteIndex] || "")) quoteIndex += 1;
  if (text[quoteIndex] !== '"') return "";

  let result = "";
  let escaped = false;
  for (let i = quoteIndex + 1; i < text.length; i += 1) {
    const char = text[i];
    if (escaped) {
      result += `\\${char}`;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') return result;
    result += char;
  }

  return result;
}

function extractHtmlDocument(text) {
  if (typeof text !== "string") {
    throw new Error("AI response is not text");
  }

  const cleaned = cleanGeneratedHtml(text)
    .replace(/```html/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.search(/<!doctype html>|<html[\s>]/i);

  // No HTML document at all.
  if (start === -1) {
    throw new Error("AI response does not contain an HTML document");
  }

  // Find the closing </html> tag if present. If the response was truncated
  // (common with long generations), we still salvage everything from the
  // opening tag to the end and auto-close the document so it renders.
  const end = cleaned.toLowerCase().lastIndexOf("</html>");

  let html;
  if (end !== -1 && end > start) {
    html = cleaned.slice(start, end + "</html>".length);
  } else {
    // Truncated response — take the remainder and repair it.
    html = cleaned.slice(start);
    html = repairTruncatedHtml(html);
  }
  return html.trim();
}

/**
 * Repair a truncated HTML document so it still renders in an iframe.
 * Closes any unclosed <style>, <script>, <body> and <html> tags.
 */
function repairTruncatedHtml(html) {
  let repaired = html.trimEnd();

  const lower = repaired.toLowerCase();

  // Close an unclosed <script> tag first (most likely to break rendering).
  if (/<script[\s>]/i.test(repaired) && !/<\/script>\s*$/i.test(repaired)) {
    repaired += "\n</script>";
  }

  // Close an unclosed <style> tag.
  if (/<style[\s>]/i.test(repaired) && !/<\/style>\s*$/i.test(repaired)) {
    repaired += "\n</style>";
  }

  // Close <body> and <html> if missing.
  if (
    /<body[\s>]/i.test(repaired) &&
    !/<\/body>\s*(<\/html>)?\s*$/i.test(repaired)
  ) {
    repaired += "\n</body>";
  }
  if (/<html[\s>]/i.test(repaired) && !/<\/html>\s*$/i.test(repaired)) {
    repaired += "\n</html>";
  }

  // If there was never an <html> wrapper at all, wrap the fragment.
  if (!/<html[\s>]/i.test(repaired)) {
    repaired = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body>\n${repaired}\n</body>\n</html>`;
  }

  return repaired;
}

/**
 * Decode JSON string escape sequences (e.g. \" \\n \\t) back to their
 * literal characters. This is ONLY needed for code extracted via regex
 * from raw (un-parsed) AI text. Code that has already passed through
 * JSON.parse() is already correctly decoded and MUST NOT be passed through
 * this function again — doing so corrupts legitimate JS escape sequences
 * (e.g. a /\n/ regex becomes a broken literal newline, causing
 * "Unexpected token" SyntaxErrors in the iframe srcDoc preview).
 */
export function decodeJsonEscapes(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\//g, "/");
}

export function cleanGeneratedHtml(code) {
  if (typeof code !== "string") {
    throw new Error("AI code response is not text");
  }

  let cleaned = code
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // NOTE: decodeJsonEscapes() is intentionally NOT called here. This
  // function runs on code that has already been JSON.parse()'d in the
  // happy path, so the escapes are already decoded. Re-decoding would
  // mangle valid JS (regexes, template literals) and break the preview.
  // decodeJsonEscapes is applied only at the regex-fallback extraction
  // sites in the website controller, where raw (un-parsed) text is used.

  const htmlStart = cleaned.search(/<!doctype html>|<html[\s>]/i);
  if (htmlStart !== -1) {
    cleaned = cleaned.slice(htmlStart).trim();
  }

  const htmlEnd = cleaned.toLowerCase().lastIndexOf("</html>");
  if (htmlEnd !== -1) {
    cleaned = cleaned.slice(0, htmlEnd + "</html>".length).trim();
  }

  cleaned = cleaned
    .replace(/^['"]+/, "")
    .replace(/['"]+$/, "")
    .replace(/^[{}\],\s]+/, "")
    .replace(/[{}\],\s]+$/, "")
    .trim();

  return cleaned;
}

/**
 * Parse the AI response into { message, pageData }.
 *
 * The AI is now instructed to return a JSON object with two fields:
 *   { "message": "...", "pageData": { ...structured page definition... } }
 *
 * We also accept the case where the pageData object is returned at the top
 * level (i.e. the AI omits the wrapper and returns the schema directly).
 * The frontend's normalizePageData() is the final safety net, so here we
 * only validate the minimal shape (sections must be an array).
 */
export function parseAIWebsiteResponse(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("AI response is empty");
  }

  let parsed;
  try {
    parsed = extractJsonObject(text);
  } catch (jsonError) {
    throw new Error(
      "AI response does not contain a parseable JSON object with pageData",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI JSON response must be an object");
  }

  const message =
    typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message.trim()
      : "Website generated successfully";

  // Accept pageData nested under a "pageData" key, OR returned at the top
  // level (schemaVersion + sections present directly on the root object).
  let pageData = null;
  if (parsed.pageData && typeof parsed.pageData === "object") {
    pageData = parsed.pageData;
  } else if (parsed.schemaVersion && Array.isArray(parsed.sections)) {
    pageData = parsed;
  }

  if (
    !pageData ||
    typeof pageData !== "object" ||
    !Array.isArray(pageData.sections)
  ) {
    throw new Error("AI response does not contain a valid pageData object");
  }

  return { message, pageData };
}

/**
 * Build a mock pageData response used when OpenRouter is unavailable.
 *
 * Returns a JSON string shaped exactly like a real AI response so the rest of
 * the pipeline (parseAIWebsiteResponse → controller → frontend) can run without
 * any special-casing. The mock includes a hero, features and CTA section so the
 * editor preview is non-trivial.
 *
 * @param {string} reason - human readable reason for the fallback.
 * @returns {string} JSON string with { message, pageData }.
 */
function buildMockWebsiteResponse(reason = "OpenRouter is unavailable") {
  const safeReason = String(reason).replace(/</g, "<");
  return JSON.stringify({
    message: `Mock website generated because ${safeReason}.`,
    pageData: {
      schemaVersion: 1,
      meta: {
        title: "Lume Offline Preview",
        description:
          "A fallback page generated while the AI provider is unavailable.",
        lang: "en",
        theme: {
          primary: "#4c7294",
          accent: "#6fb1d6",
          background: "#0b1020",
          text: "#f5f7fb",
          muted: "#b6c2d1",
          radius: "16px",
          font: "system-ui, sans-serif",
        },
      },
      header: {
        brand: "Lume",
        logoText: "Lume",
        links: [
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Contact", href: "#contact" },
        ],
        ctaLabel: "Get started",
        ctaHref: "#cta",
      },
      sections: [
        {
          id: "mock-hero",
          type: "hero",
          props: {
            eyebrow: "Offline fallback active",
            title: "Lume is connected, but OpenRouter is unreachable.",
            subtitle:
              "Your backend and database are working. This preview is returned so you can keep testing the editor flow while the AI provider is unavailable.",
            primaryCta: { label: "Test interaction", href: "#" },
            secondaryCta: {
              label: "OpenRouter status",
              href: "https://openrouter.ai/",
            },
            image: {
              src: "",
              alt: "",
            },
          },
        },
        {
          id: "mock-features",
          type: "features",
          props: {
            eyebrow: "System status",
            title: "What's still working",
            items: [
              {
                icon: "server",
                title: "Backend",
                description: "API routes are responding normally.",
              },
              {
                icon: "database",
                title: "Database",
                description: "Website records can still be stored and updated.",
              },
              {
                icon: "cpu",
                title: "AI Provider",
                description: safeReason,
              },
            ],
          },
        },
        {
          id: "mock-cta",
          type: "cta",
          props: {
            title: "Ready when you are",
            subtitle:
              "Once the AI provider is back online, regenerate this page to get a fresh design.",
            primaryCta: { label: "Regenerate", href: "#" },
            secondaryCta: { label: "Back to dashboard", href: "/" },
          },
        },
      ],
      footer: {
        brand: "Lume",
        description:
          "AI-powered website builder. This is an offline fallback preview.",
        columns: [
          {
            title: "Product",
            links: [
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "#" },
              { label: "Contact", href: "#contact" },
            ],
          },
        ],
        socials: [
          { label: "GitHub", href: "https://github.com", icon: "github" },
          { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
        ],
        copyright: "Lume",
      },
    },
  });
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryModel(model, apiKey, clientPrompt) {
  console.log(`  Trying model: ${model}...`);

  const response = await fetchWithTimeout(
    OPENROUTER_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Lume Web Builder",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              'You are a senior frontend architect and UI/UX engineer. You generate STRUCTURED website definitions as a JSON "pageData" object — NOT raw HTML or React code. The pageData object is the Single Source of Truth and is rendered by a pre-built React component system. Return ONLY a valid JSON object with exactly two fields: "message" (a short confirmation string) and "pageData" (the structured page definition). The pageData object MUST have this exact top-level shape: { "schemaVersion": 1, "meta": { "title", "description", "lang", "theme": { "primary", "mode", "font", "radius" } }, "header": { "id", "type", "brand", "logoText", "links": [{"label","href"}], "ctaLabel", "ctaHref" }, "sections": [ ... ], "footer": { "id", "type", "brand", "columns": [{"title","links":[{"label","href"}]}], "socials": [{"icon","label","href"}] } }. Each item in the sections array MUST have a unique "id" string and a "type" which is one of: "hero", "features", "stats", "gallery", "testimonials", "pricing", "cta", "contact". Section-specific props: hero={eyebrow,title,subtitle,primaryCta:{label,href},secondaryCta:{label,href},image:{src,alt}}; features={eyebrow,title,items:[{icon,title,description}]}; stats={title,items:[{label,value}]}; gallery={eyebrow,title,columns,items:[{src,alt}]}; testimonials={eyebrow,title,items:[{quote,author,role,avatar}]}; pricing={eyebrow,title,plans:[{name,price,period,description,features:[],featured,cta:{label,href}}]}; cta={title,subtitle,primaryCta:{label,href},secondaryCta:{label,href}}; contact={title,subtitle,fields:[{name,label,type,placeholder,required}]}. Use realistic business content (NO lorem ipsum). Use Unsplash image URLs ending with ?auto=format&fit=crop&w=1200&q=80 for all images. Do not include markdown fences, prose, reasoning, or any text outside the JSON object. Keep the JSON compact so it fits within the token limit.',
          },
          {
            role: "user",
            content: `You are a website design assistant. Your task is to generate a complete, structured pageData JSON object for the user's request. The pageData will be rendered by a React component system (Hero, Features, Stats, Gallery, Testimonials, Pricing, CTA, Contact sections). Produce realistic, business-ready content with no lorem ipsum. Strictly follow the schema and rules provided by the user.\n\n${clientPrompt}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 16000,
      }),
    },
    FETCH_TIMEOUT_MS,
  );

  const data = await response.json();

  // ── Handle rate limiting (429) ──
  if (response.status === 429) {
    console.log(`  ⏳ ${model} is rate-limited.`);
    return { status: "rate_limited" };
  }

  // ── Handle other errors ──
  if (!response.ok) {
    const errorMsg =
      data.error?.message || `OpenRouter returned status ${response.status}`;
    console.log(`  ✗ ${model} failed: ${errorMsg}`);

    // Account/auth errors will not be fixed by trying more models.
    if (
      response.status === 401 ||
      response.status === 403 ||
      /user not found|invalid api key|unauthorized|forbidden/i.test(errorMsg)
    ) {
      return {
        status: "fatal",
        message: normalizeFatalOpenRouterMessage(errorMsg),
      };
    }

    return { status: "error", message: errorMsg };
  }

  // ── Extract the AI response text ──
  const aiText = data?.choices?.[0]?.message?.content;
  if (!aiText) {
    console.error(
      "  ✗ Unexpected API response structure:",
      JSON.stringify(data).slice(0, 500),
    );
    return { status: "error", message: "Empty response from AI model" };
  }

  console.log(`  ✓ ${model} responded successfully`);
  let parsed;
  try {
    parsed = parseAIWebsiteResponse(aiText);
  } catch (error) {
    console.warn(`  ✗ ${model} returned invalid JSON: ${error.message}`);
    return { status: "error", message: `Invalid JSON from ${model}` };
  }

  return { status: "success", content: JSON.stringify(parsed) };
}

async function generateAIResponse(clientPrompt) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    console.warn(
      "No OpenRouter API key found in .env (expected OPEN_ROUTER_API_KEY or OPENROUTER_API_KEY). Returning a mock response to test the frontend and backend connection.",
    );

    return buildMockWebsiteResponse("the OpenRouter API key is missing");
  }

  console.log(`\nStarting AI generation with one model: ${ACTIVE_MODEL}`);

  try {
    const result = await tryModel(ACTIVE_MODEL, apiKey, clientPrompt);

    if (result.status === "success") {
      return result.content;
    }

    if (result.status === "fatal") {
      throw new Error(result.message);
    }

    if (result.status === "rate_limited") {
      throw new Error(
        `${ACTIVE_MODEL} is rate-limited. Please try again later.`,
      );
    }

    throw new Error(result.message || `${ACTIVE_MODEL} failed.`);
  } catch (error) {
    if (
      /user not found|invalid api key|unauthorized|forbidden/i.test(
        error.message || "",
      )
    ) {
      throw error;
    }

    if (error.name === "AbortError") {
      console.error(
        `  ✗ ${ACTIVE_MODEL} timed out after ${FETCH_TIMEOUT_MS / 1000}s`,
      );
    } else {
      console.error(`  ✗ ${ACTIVE_MODEL} failed: ${error.message}`);
    }

    if (
      /fetch failed|network|econnrefused|enotfound|socket/i.test(
        error.message || "",
      )
    ) {
      console.warn(
        "OpenRouter network request failed. Returning a mock website response so local testing can continue.",
      );
      return buildMockWebsiteResponse(
        error.message || "network connectivity issues",
      );
    }

    throw error;
  }
}

export default generateAIResponse;
