// ── OpenRouter API (proxies to multiple AI models) ──
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FETCH_TIMEOUT_MS = 120_000;

// Prioritized list of free models — if one is rate-limited, fall back to the next
// Verified against OpenRouter API: only models ending with ":free" are actually free
const FALLBACK_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
];

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
            role: "user",
            content: `You are a web development assistant. Your task is to generate HTML, CSS, and JavaScript code for the user's request. The code should be clean, modern, and responsive. Do not include any explanations or comments in the code. strictly follow the rules and style provided by the user.\n\n${clientPrompt}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
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
  return { status: "success", content: aiText };
}

async function generateAIResponse(clientPrompt) {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    console.warn(
      "OPEN_ROUTER_API_KEY is not set in .env! Returning a mock response to test the frontend and backend connection.",
    );

    return JSON.stringify({
      message:
        "This is a mock generated website because the OpenRouter API key is missing. The frontend and backend connection is working perfectly!",
      code: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mock Lume Website</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #111; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #222; padding: 2rem; border-radius: 12px; border: 1px solid #333; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            h1 { color: #4C7294; margin-top: 0; }
            button { background: #4C7294; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 1rem; }
            button:hover { background: #3b5c7a; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Backend Connected! 🚀</h1>
            <p>Your frontend successfully called the backend!</p>
            <p>To see the real AI generation, please add your <b>OPEN_ROUTER_API_KEY</b> to the backend <code>.env</code> file.</p>
            <button onclick="alert('JavaScript works too!')">Click Me</button>
          </div>
        </body>
        </html>
      `,
    });
  }

  console.log(
    `\nStarting AI generation with ${FALLBACK_MODELS.length} fallback models...`,
  );

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    console.log(`\nModel ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

    try {
      const result = await tryModel(model, apiKey, clientPrompt);

      if (result.status === "success") {
        return result.content;
      }

      if (result.status === "rate_limited") {
        // Add a small delay before trying the next model
        if (i < FALLBACK_MODELS.length - 1) {
          const delay = 2_000 * (i + 1);
          console.log(`  Switching to next model in ${delay / 1000}s...`);
          await sleep(delay);
        }
        continue;
      }

      // Other errors — also try next model
      if (i < FALLBACK_MODELS.length - 1) {
        console.log(`  Falling back to next model...`);
        await sleep(2000);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error(
          `  ✗ ${model} timed out after ${FETCH_TIMEOUT_MS / 1000}s`,
        );
      } else {
        console.error(`  ✗ ${model} threw: ${error.message}`);
      }

      if (i < FALLBACK_MODELS.length - 1) {
        console.log(`  Falling back to next model...`);
        await sleep(2000);
      }
    }
  }

  console.error(`All ${FALLBACK_MODELS.length} models failed.`);
  return null;
}

export default generateAIResponse;
