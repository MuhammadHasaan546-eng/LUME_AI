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

    return JSON.parse(cleaned.slice(start, end + 1));
  }
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

function decodeJsonEscapes(value) {
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

  cleaned = decodeJsonEscapes(cleaned);

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

export function parseAIWebsiteResponse(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("AI response is empty");
  }

  let parsed;

  try {
    parsed = extractJsonObject(text);
  } catch (jsonError) {
    // Not valid JSON — try to salvage an HTML document directly from
    // the raw text (handles plain-HTML or truncated responses).
    const code = extractHtmlDocument(text);

    return {
      message: "Website generated successfully",
      code: cleanGeneratedHtml(code),
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI JSON response must be an object");
  }

  // The model may return a valid JSON object but with a truncated "code"
  // string (response cut off mid-HTML). Salvage whatever HTML is present.
  const rawCode =
    typeof parsed.code === "string" ? parsed.code : String(parsed.code || "");
  const message =
    typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message.trim()
      : "Website generated successfully";

  // If the code field contains an HTML document (even truncated), extract
  // and repair it. Otherwise fall back to scanning the whole response.
  let code = "";
  if (rawCode.trim()) {
    try {
      code = extractHtmlDocument(rawCode);
    } catch {
      code = cleanGeneratedHtml(rawCode);
    }
  }

  if (!code.trim()) {
    // Last resort: scan the entire original response for HTML.
    code = extractHtmlDocument(text);
  }

  return {
    message,
    code: cleanGeneratedHtml(code),
  };
}

function buildMockWebsiteResponse(reason = "OpenRouter is unavailable") {
  return JSON.stringify({
    message: `Mock website generated because ${reason}.`,
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lume Offline Preview</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --card: rgba(20, 28, 48, 0.88);
      --accent: #4c7294;
      --accent-2: #6fb1d6;
      --text: #f5f7fb;
      --muted: #b6c2d1;
      --border: rgba(255, 255, 255, 0.1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      background: radial-gradient(circle at top, #182746 0%, var(--bg) 55%);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: min(720px, 100%);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }
    .badge {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(111, 177, 214, 0.14);
      color: var(--accent-2);
      font-size: 14px;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 4vw, 3.25rem);
      line-height: 1.1;
    }
    p {
      color: var(--muted);
      line-height: 1.7;
      font-size: 1rem;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 24px;
    }
    button, a {
      border: 0;
      border-radius: 12px;
      padding: 14px 18px;
      font: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    button {
      background: var(--accent);
      color: white;
    }
    a {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    button:hover, a:hover { transform: translateY(-1px); opacity: 0.95; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 28px;
    }
    .panel {
      padding: 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
    }
    .panel strong { display: block; margin-bottom: 8px; }
    @media (max-width: 768px) {
      .card { padding: 24px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">Offline fallback active</span>
    <h1>Lume is connected, but OpenRouter is unreachable.</h1>
    <p>
      Your backend and database are working. This preview is returned so you can
      keep testing the editor flow while the AI provider is unavailable.
    </p>
    <div class="actions">
      <button onclick="alert('Frontend, backend, and JavaScript are all working.')">Test interaction</button>
      <a href="https://openrouter.ai/" target="_blank" rel="noreferrer">OpenRouter status</a>
    </div>
    <section class="grid">
      <article class="panel">
        <strong>Backend</strong>
        <span>API routes are responding normally.</span>
      </article>
      <article class="panel">
        <strong>Database</strong>
        <span>Website records can still be stored and updated.</span>
      </article>
      <article class="panel">
        <strong>AI Provider</strong>
        <span>${reason.replace(/</g, "&lt;")}</span>
      </article>
    </section>
  </main>
</body>
</html>`,
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
              'You are a senior React 18 + Next.js frontend engineer. Generate a premium, production-grade single-page website using React 18 (functional components + hooks), written in Next.js App-Router style, delivered as ONE self-contained HTML file. The HTML must include CDN scripts for React 18, ReactDOM 18, Babel Standalone (for in-browser JSX), and Tailwind CSS. Write the React app inside a single <script type="text/babel"> tag and mount it with ReactDOM.createRoot(document.getElementById("root")).render(<App />). Return ONLY valid JSON with exactly two string fields: "message" and "code". The code value must contain ONE complete HTML document starting with <!DOCTYPE html> and ending with </html>. Do not include markdown fences, prose, reasoning, or any text outside the JSON object. Keep the code compact (no excessive blank lines) so it fits within the token limit. Always finish the document with </html>.',
          },
          {
            role: "user",
            content: `You are a React 18 + Next.js web development assistant. Your task is to generate a complete, self-contained HTML file containing a React 18 application (using CDN React, ReactDOM, Babel, and Tailwind CSS) for the user's request. The code should be clean, modern, fully responsive, and use functional components with hooks. Do not include any explanations or comments outside the code. Strictly follow the rules and style provided by the user.\n\n${clientPrompt}`,
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
