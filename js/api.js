/* ============================================================
   NeuroHub — api.js
   All server fetch calls, error classification, abort support
   ============================================================ */

/**
 * Classify a fetch error into a user-friendly message object.
 * @param {Error|Response} err
 * @returns {{ title: string, desc: string }}
 */
function classifyError(err) {
  // Aborted — not a real error, caller handles separately
  if (err?.name === 'AbortError') return null;

  // Network/fetch failure (server not running)
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return {
      title: 'Server not reachable',
      desc:  'Your server is not running. Start it with: node server.js',
    };
  }

  const status = err?.status || (typeof err === 'number' ? err : null);

  if (status === 401 || status === 403) {
    return {
      title: 'API key error',
      desc:  'A request was rejected. Check that all API keys are set correctly in your .env file.',
    };
  }

  if (status === 429) {
    return {
      title: 'Rate limit reached',
      desc:  'Too many requests in a short period. Wait a moment and try again.',
    };
  }

  if (status === 500 || status === 502 || status === 503) {
    return {
      title: 'Server error',
      desc:  `The server encountered a problem (HTTP ${status}). Check your terminal for error logs.`,
    };
  }

  if (status === 404) {
    return {
      title: 'Endpoint not found',
      desc:  `The route for this AI hasn't been added to server.js yet. Add the endpoint and restart your server.`,
    };
  }

  return {
    title: 'Unexpected error',
    desc:  err?.message || 'Something went wrong. Please try again.',
  };
}

/**
 * Core fetch wrapper — throws classified error objects.
 * Returns parsed JSON { reply } or throws.
 */
async function apiFetch(endpoint, message, signal) {
  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message }),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    const info = classifyError(err);
    const classified = new Error(info.desc);
    classified.title = info.title;
    throw classified;
  }

  if (!response.ok) {
    const info = classifyError(response);
    const err  = new Error(info.desc);
    err.title  = info.title;
    err.status = response.status;
    throw err;
  }

  const data = await response.json();

  if (data.error) {
    const err = new Error(data.error);
    err.title = 'AI API error';
    throw err;
  }

  return data.reply;
}

/**
 * Step 1 — Ask AI 1 to draft an initial answer.
 */
async function draftAnswer(aiId, question, signal) {
  const ai     = AI_MODELS[aiId];
  const prompt =
    `You are a helpful AI assistant. Answer the following question clearly and accurately.\n` +
    `Write 3–5 sentences of flowing prose. Do not use bullet points or lists.\n\n` +
    `Question: "${question}"`;

  return apiFetch(ai.endpoint, prompt, signal);
}

/**
 * Step 2 — Ask AI 2 to review and improve AI 1's answer.
 */
async function refineAnswer(aiId, question, draft, signal) {
  const ai     = AI_MODELS[aiId];
  const prompt =
    `Another AI answered this question:\n` +
    `Question: "${question}"\n\n` +
    `Their answer:\n"${draft}"\n\n` +
    `Your task: Carefully review the answer above. Fix any factual errors, fill in important missing points, ` +
    `and improve the clarity and completeness. Write your improved version in 3–5 sentences of prose. ` +
    `Do not add meta-commentary like "the previous answer was..." — write the improved answer directly.`;

  return apiFetch(ai.endpoint, prompt, signal);
}

/**
 * Step 3 — Ask AI 1 to synthesise both answers into a final response.
 */
async function synthesiseAnswer(aiId, question, draft, refined, signal) {
  const ai     = AI_MODELS[aiId];
  const prompt =
    `You were asked: "${question}"\n\n` +
    `You gave this initial answer:\n"${draft}"\n\n` +
    `A second AI improved it to:\n"${refined}"\n\n` +
    `Now write the definitive final answer. Take the strongest points from both versions, ` +
    `resolve any contradictions, and produce a clear, accurate, well-rounded response in 4–6 sentences. ` +
    `Write the answer directly — no preamble like "Here is the final answer".`;

  return apiFetch(ai.endpoint, prompt, signal);
}
