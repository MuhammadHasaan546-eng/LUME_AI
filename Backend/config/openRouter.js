const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "qwen/qwen-2.5-72b-instruct:free";

async function generateAIResponse(clientPrompt) {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        // "HTTP-Referer": "https://lume-web-builder.vercel.app",
        "X-Title": "Lume Web Builder",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a web development assistant. Your task is to generate HTML, CSS, and JavaScript code for the user's request. The code should be clean, modern, and responsive. Do not include any explanations or comments in the code. strictly follow the rules and style provided by the user",
          },
          {
            role: "user",
            content: clientPrompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error.message || "Failed to generate AI response");
    }

    const aiText = data.choices[0].message.content;
    return aiText;
  } catch (error) {
    console.error("OpenRouter Fetch Error:", error);
    return null;
  }
}
