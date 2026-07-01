// ============================================================
// server.js - Express server for NeuroHub
// ============================================================

require("dotenv").config();

const express = require("express");
const path    = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const rateLimit = require("express-rate-limit");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Serve your frontend files ─────────────────────────────────
// This is what was missing! Now http://localhost:3000 loads index.html
app.use(express.static(path.join(__dirname)));

// ── Rate limiter ──────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // increased slightly to handle 3 calls per question
  message: { error: "Too many requests, please try again later." },
});
app.use("/ask", limiter);

// ── Gemini client ─────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ── POST /ask  →  Gemini ──────────────────────────────────────
app.post("/ask", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({
      error: "Request body must include a non-empty 'message' string.",
    });
  }

  try {
    const result = await geminiModel.generateContent(message.trim());
    const reply  = result.response.text();
    return res.status(200).json({ reply });

  } catch (error) {
    if (error.status) {
      console.error(`Gemini API error [${error.status}]:`, error.message);
      return res.status(error.status).json({
        error: `Gemini API error: ${error.message}`,
      });
    }
    console.error("Unexpected server error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred. Please try again later.",
    });
  }
});

// ── POST /ask-llama  →  Groq (Llama 3) ───────────────────────
// Install: npm install groq-sdk
// Get free API key: https://console.groq.com
app.post("/ask-llama", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Missing message." });
  }

  try {
    const Groq   = require("groq-sdk");
    const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: message.trim() }],
    });

    const reply = completion.choices[0]?.message?.content || "";
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Groq/Llama error:", error.message);
    return res.status(error.status || 500).json({
      error: `Llama API error: ${error.message}`,
    });
  }
});

// ── POST /ask-claude  →  Anthropic Claude ────────────────────
// Install: npm install @anthropic-ai/sdk
// Get API key: https://console.anthropic.com
app.post("/ask-claude", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Missing message." });
  }

  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model:      "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages:   [{ role: "user", content: message.trim() }],
    });

    const reply = response.content[0]?.text || "";
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Claude error:", error.message);
    return res.status(error.status || 500).json({
      error: `Claude API error: ${error.message}`,
    });
  }
});

// ── POST /ask-gpt  →  OpenAI GPT-4o ─────────────────────────
// Install: npm install openai
// Get API key: https://platform.openai.com
app.post("/ask-gpt", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Missing message." });
  }

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model:    "gpt-4o",
      messages: [{ role: "user", content: message.trim() }],
    });

    const reply = completion.choices[0]?.message?.content || "";
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("GPT error:", error.message);
    return res.status(error.status || 500).json({
      error: `GPT API error: ${error.message}`,
    });
  }
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ NeuroHub running at http://localhost:${PORT}\n`);
});
