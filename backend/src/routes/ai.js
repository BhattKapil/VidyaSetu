import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

const router = express.Router();

router.post("/", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system || "" },
          ...messages
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || "Groq API error" });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "No response received.";
    return res.json({ content: text });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Groq API" });
  }
});

export default router;
