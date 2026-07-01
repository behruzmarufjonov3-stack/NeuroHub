# NeuroHub — Think Together

> Two AIs collaborate to give you one better answer.

NeuroHub connects two AI models so they can **think together** — one drafts, the other refines, and together they produce a final answer that's stronger than either could generate alone.

![NeuroHub Screenshot](neurohub.png)

---

## How It Works

```
Your Question
     │
     ▼
┌─────────────┐
│   AI One    │  Drafts an initial answer
└─────────────┘
     │
     ▼
┌─────────────┐
│   AI Two    │  Reviews, fixes mistakes, fills gaps
└─────────────┘
     │
     ▼
┌─────────────┐
│  AI One     │  Synthesises the best of both
└─────────────┘
     │
     ▼
  Final Answer
```

---

## Features

- 🧠 **Two AIs think together** — collaborative answer synthesis
- 🎛 **Choose your AIs** — pick any combination from Gemini, Claude, GPT-4o, or Llama 3
- 👁 **See the thinking** — collapsible step cards show what each AI contributed
- ⏹ **Stop anytime** — cancel mid-process with one click
- ⚠️ **Smart error handling** — detects server issues, rate limits, and API key problems
- 📱 **Responsive design** — works on desktop and mobile
- 🆓 **Free to run** — Gemini + Llama (Groq) are both free APIs

---

## Supported AI Models

| Model | Provider | Cost |
|-------|----------|------|
| Gemini 2.0 Flash | Google | ✅ Free |
| Llama 3.3 70B | Meta via Groq | ✅ Free |
| Claude 3.5 Sonnet | Anthropic | 💳 Paid |
| GPT-4o | OpenAI | 💳 Paid |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v8 or higher

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/neurohub.git
cd neurohub
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
# Copy the example file
cp .env.example .env

# Open .env and add your API keys
```

**4. Add your API keys to `.env`**

At minimum you need **one** of these free keys to get started:
- **Gemini** (free) → [aistudio.google.com](https://aistudio.google.com/app/apikey)
- **Groq/Llama** (free) → [console.groq.com](https://console.groq.com)

**5. Start the server**
```bash
node server.js
```

**6. Open in browser**
```
http://localhost:3000
```

---

## Project Structure

```
neurohub/
├── server.js          # Express server + all AI API endpoints
├── index.html         # Main HTML page
├── .env.example       # Environment variable template
├── package.json       # Dependencies
├── css/
│   ├── main.css       # Global variables, reset, typography
│   ├── components.css # Header, buttons, badges, cards
│   └── think.css      # AI selector, pipeline, step cards
└── js/
    ├── ai-config.js   # AI model definitions and branding
    ├── api.js         # Fetch calls, error handling, abort logic
    └── ui.js          # State machine, DOM rendering, events
```

---

## API Endpoints

| Endpoint | AI Model | Notes |
|----------|----------|-------|
| `POST /ask` | Gemini 2.0 Flash | Requires `GEMINI_API_KEY` |
| `POST /ask-llama` | Llama 3.3 70B | Requires `GROQ_API_KEY` |
| `POST /ask-claude` | Claude 3.5 Sonnet | Requires `ANTHROPIC_API_KEY` |
| `POST /ask-gpt` | GPT-4o | Requires `OPENAI_API_KEY` |

All endpoints accept:
```json
{ "message": "your prompt here" }
```

And return:
```json
{ "reply": "AI response here" }
```

---

## Tech Stack

- **Backend** — Node.js, Express
- **Frontend** — Vanilla HTML, CSS, JavaScript (no frameworks)
- **AI APIs** — Google Gemini, Groq (Llama), Anthropic Claude, OpenAI GPT
- **Fonts** — Inter + Lora (Google Fonts)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | For Gemini | Google AI Studio API key |
| `GROQ_API_KEY` | For Llama | Groq Console API key |
| `ANTHROPIC_API_KEY` | For Claude | Anthropic Console API key |
| `OPENAI_API_KEY` | For GPT-4o | OpenAI Platform API key |
| `PORT` | No | Server port (default: 3000) |

---

## Contributing

Pull requests are welcome! If you'd like to add a new AI model or feature, feel free to open an issue first to discuss.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

Built by **[Your Name]** — connect with me on [LinkedIn](https://linkedin.com/in/YOUR_PROFILE)

---

*NeuroHub is an independent project and is not affiliated with Google, Anthropic, OpenAI, or Meta.*
