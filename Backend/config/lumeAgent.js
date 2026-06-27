// ── Lume.ai Multi-Agent Component Generation System ──
//
// Four specialist agents collaborate to produce one production-ready
// Next.js TypeScript component:
//
//   1. UI & Structural Architect   → Tailwind layout + Locomotive Scroll attrs
//   2. Master Motion Designer       → GSAP timelines & scroll interactions
//   3. 3D WebGL Specialist          → Three.js / R3F canvas graphics
//   4. Lead Merger Agent            → Compiles 1+2+3 into one flawless file
//
// Specialists 1-3 run in parallel; the merger runs once all three complete.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FETCH_TIMEOUT_MS = 120_000;

// Use one model consistently so generation behavior is predictable.
// Override per-environment with LUME_AGENT_MODEL if needed.
const ACTIVE_MODEL =
  process.env.LUME_AGENT_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

function getOpenRouterApiKey() {
  return (
    process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_API_KEY || null
  );
}

// ───────────────────────────────────────────────────────────
// Specialist system prompts
// ───────────────────────────────────────────────────────────

export const UI_ARCHITECT_PROMPT = `You are the UI & Structural Architect for Lume.ai. Your sole responsibility is to generate the visual layout, HTML/JSX tags, and Tailwind CSS structure for a premium Next.js TypeScript component based on the user's prompt.

RULES:
1. Use Next.js 14+ App Router standards (Client components where necessary).
2. Apply high-end "Modern Luxury" and editorial visual design using Tailwind CSS (e.g., neutral-950 backgrounds, elegant borders, tracking-widest typography, luxury card grids).
3. Integrate placeholders for shadcn/ui components where appropriate.
4. Add Locomotive Scroll attributes (data-scroll, data-scroll-section, data-scroll-speed) on elements to prepare them for smooth scrolling.
5. DO NOT write any complex GSAP code or Three.js WebGL rendering logic. Focus 100% on pure UI layout, typography, and responsive grid structures.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact schema. No markdown fences, no prose, no text outside the JSON:
{
  "section": "UI_LAYOUT",
  "code": "<full JSX/TSX layout code here>"
}`;

export const MOTION_DESIGNER_PROMPT = `You are the Master Motion Designer for Lume.ai, specializing in GSAP (GreenSock Animation Platform) and Locomotive Scroll. Your job is to generate pure JavaScript/TypeScript animation logic based on the user's prompt.

RULES:
1. Write bulletproof GSAP timelines, ScrollTriggers, or text-splitting reveal animations.
2. Ensure all GSAP code is wrapped safely inside React hooks like useGSAP or useEffect with proper cleanup returns to prevent memory leaks in Next.js.
3. Provide comments or structural mappings on how these animations should target specific DOM elements (e.g., .luxury-title, .reveal-card).
4. Include any advanced scroll-bound micro-interactions or custom cursor logic requested.
5. DO NOT generate UI markup or Three.js webgl code. Focus 100% on motion logic, timelines, and interaction states.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact schema. No markdown fences, no prose, no text outside the JSON:
{
  "section": "ANIMATION_LOGIC",
  "code": "<full GSAP animation logic code here>"
}`;

export const WEBGL_SPECIALIST_PROMPT = `You are the 3D WebGL Specialist for Lume.ai, using Three.js and React Three Fiber (R3F). Your job is to design modern, high-end 3D graphics that elevate the website to premium Awwwards standards.

RULES:
1. Generate abstract luxury 3D scenes, floating geometric meshes, generative particle fields, interactive liquid meshes, or background canvas shaders based on the prompt.
2. Keep the code optimized for web performance (low polygon count, clean rendering animation loops).
3. Deliver the code as a self-contained component or a canvas-initializer setup that can be easily injected as a background or side visual element in a website layout.
4. DO NOT write general website layout UI or GSAP timeline animations. Focus 100% on Three.js/WebGL canvas mechanics.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact schema. No markdown fences, no prose, no text outside the JSON:
{
  "section": "3D_CANVAS",
  "code": "<full Three.js / R3F canvas code here>"
}`;

export const MERGER_AGENT_PROMPT = `You are the Lead Merger Agent and Senior Code Reviewer for Lume.ai. Your job is to compile, integrate, and refactor code parts from three specialist models into one flawless, production-ready Next.js TypeScript component file.

INPUTS YOU WILL RECEIVE:
- [UI LAYOUT]: Next.js layout with Tailwind CSS and Locomotive Scroll structural data.
- [ANIMATION LOGIC]: GSAP animation timelines and setup.
- [3D CANVAS]: Three.js interactive graphics code.

YOUR EXACT RULES:
1. Seamless Integration: Inject the [3D CANVAS] code into the background/foreground of the [UI LAYOUT], and wire up the [ANIMATION LOGIC] (GSAP hooks) to target the DOM selectors generated in the UI.
2. Clean TypeScript: Use strict typing. Ensure all imports (gsap, three, lucide-react, etc.) are absolute and complete at the top of the file.
3. No Code Hallucinations: Do not skip code lines or use comments like "// rest of the code goes here". Deliver the FULL codebase.
4. Rigid Output Format: You must output ONLY a valid JSON object matching this schema. No conversational chit-chat, no outer markdown wrap.

{
  "componentName": "NameOfComponentInPascalCase",
  "finalCode": "/* Full Next.js TypeScript Code ready to be written directly to a file */"
}`;

// ───────────────────────────────────────────────────────────
// JSON extraction helpers
// ───────────────────────────────────────────────────────────

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

// ───────────────────────────────────────────────────────────
// OpenRouter transport
// ───────────────────────────────────────────────────────────

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

/**
 * Generic OpenRouter chat call.
 * Sends a system + user message pair and returns the raw assistant text.
 */
async function callOpenRouter(systemPrompt, userPrompt, label) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is missing. Set OPEN_ROUTER_API_KEY in Backend/.env",
    );
  }

  console.log(`  ▸ [${label}] calling ${ACTIVE_MODEL}...`);

  const response = await fetchWithTimeout(
    OPENROUTER_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Lume Web Builder — Agent",
      },
      body: JSON.stringify({
        model: ACTIVE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    },
    FETCH_TIMEOUT_MS,
  );

  const data = await response.json();

  if (response.status === 429) {
    throw new Error(`[${label}] model is rate-limited (429). Try again later.`);
  }

  if (!response.ok) {
    const errorMsg =
      data?.error?.message || `OpenRouter returned status ${response.status}`;
    throw new Error(`[${label}] ${errorMsg}`);
  }

  const aiText = data?.choices?.[0]?.message?.content;
  if (!aiText) {
    throw new Error(`[${label}] empty response from AI model`);
  }

  console.log(`  ✓ [${label}] responded`);
  return aiText;
}

/**
 * Runs a single specialist agent and normalizes its output to a code string.
 * Tries to parse a JSON envelope ({ section, code }); falls back to raw text.
 */
async function runSpecialist(systemPrompt, userPrompt, label) {
  const raw = await callOpenRouter(systemPrompt, userPrompt, label);

  try {
    const parsed = extractJsonObject(raw);
    return {
      label,
      code: typeof parsed.code === "string" ? parsed.code : raw,
      raw,
    };
  } catch {
    // If the model ignored the JSON envelope, treat the whole text as code.
    return { label, code: raw, raw };
  }
}

// ───────────────────────────────────────────────────────────
// Mock fallback (used when no API key is configured)
// ───────────────────────────────────────────────────────────

function buildMockComponentResponse(userPrompt) {
  const safeName = "LumePreview";
  const safePrompt = String(userPrompt || "")
    .replace(/[`$]/g, "")
    .slice(0, 120);

  const finalCode = [
    '"use client";',
    "",
    'import { useEffect, useRef } from "react";',
    "",
    "/**",
    " * " + safeName,
    " * Mock component — OpenRouter API key is missing.",
    " * Prompt: " + safePrompt,
    " */",
    "export default function " + safeName + "() {",
    "  const containerRef = useRef(null);",
    "",
    "  useEffect(() => {",
    "    return () => {};",
    "  }, []);",
    "",
    "  return (",
    "    <section",
    "      ref={containerRef}",
    '      className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center"',
    "      data-scroll-section",
    "    >",
    '      <div className="text-center px-6" data-scroll data-scroll-speed="2">',
    '        <h1 className="text-4xl md:text-6xl font-light tracking-widest uppercase">',
    "          Lume Agent Offline",
    "        </h1>",
    '        <p className="mt-4 text-neutral-400 tracking-wide">',
    "          Add an OpenRouter API key to enable multi-agent generation.",
    "        </p>",
    "      </div>",
    "    </section>",
    "  );",
    "}",
  ].join("\n");

  return {
    componentName: safeName,
    finalCode,
    specialists: {
      uiLayout: "// UI layout mock — API key missing",
      animationLogic: "// Animation logic mock — API key missing",
      webglCanvas: "// 3D canvas mock — API key missing",
    },
  };
}

// ───────────────────────────────────────────────────────────
// Main pipeline
// ───────────────────────────────────────────────────────────

/**
 * Runs the full 4-agent pipeline for a user prompt.
 *
 * Stage 1 — Specialists 1-3 run in parallel (UI, Motion, WebGL).
 * Stage 2 — Their outputs are assembled into a single merger prompt.
 * Stage 3 — The merger agent compiles everything into one component.
 *
 * @param {string} userPrompt
 * @returns {Promise<{ componentName: string, finalCode: string, specialists: object }>}
 */
export async function generateComponent(userPrompt) {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error("Prompt is required");
  }

  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    console.warn(
      "No OpenRouter API key found (expected OPEN_ROUTER_API_KEY or OPENROUTER_API_KEY). Returning a mock component response.",
    );
    return buildMockComponentResponse(userPrompt);
  }

  console.log(
    "\n🤖 Lume Agent pipeline started for prompt:",
    userPrompt.slice(0, 80),
  );

  // ── Stage 1: Run the 3 specialists in parallel ──
  const [uiResult, motionResult, webglResult] = await Promise.all([
    runSpecialist(UI_ARCHITECT_PROMPT, userPrompt, "UI_ARCHITECT"),
    runSpecialist(MOTION_DESIGNER_PROMPT, userPrompt, "MOTION_DESIGNER"),
    runSpecialist(WEBGL_SPECIALIST_PROMPT, userPrompt, "WEBGL_SPECIALIST"),
  ]);

  console.log("✓ All 3 specialists completed. Starting merger agent...");

  // ── Stage 2: Build the merger input ──
  const mergerUserPrompt = `Compile the following three specialist outputs into ONE flawless, production-ready Next.js TypeScript component.

USER PROMPT:
${userPrompt}

[UI LAYOUT]:
${uiResult.code}

[ANIMATION LOGIC]:
${motionResult.code}

[3D CANVAS]:
${webglResult.code}

Remember: output ONLY a valid JSON object with "componentName" and "finalCode". No markdown fences, no prose.`;

  // ── Stage 3: Run the merger agent ──
  const mergerRaw = await callOpenRouter(
    MERGER_AGENT_PROMPT,
    mergerUserPrompt,
    "MERGER",
  );

  let merged;
  try {
    merged = extractJsonObject(mergerRaw);
  } catch (error) {
    throw new Error(`Merger agent did not return valid JSON: ${error.message}`);
  }

  if (
    !merged.componentName ||
    typeof merged.componentName !== "string" ||
    !merged.componentName.trim()
  ) {
    throw new Error("Merger agent response is missing componentName");
  }

  if (
    !merged.finalCode ||
    typeof merged.finalCode !== "string" ||
    !merged.finalCode.trim()
  ) {
    throw new Error("Merger agent response is missing finalCode");
  }

  console.log("✓ Merger complete. Component:", merged.componentName.trim());

  return {
    componentName: merged.componentName.trim(),
    finalCode: merged.finalCode,
    specialists: {
      uiLayout: uiResult.code,
      animationLogic: motionResult.code,
      webglCanvas: webglResult.code,
    },
  };
}

export default generateComponent;
