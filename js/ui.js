/* ============================================================
   NeuroHub — ui.js
   AI selector rendering, step cards, pipeline, state machine
   ============================================================ */

/* ── State ───────────────────────────────────────────────────── */
const state = {
  ai1:         DEFAULT_AI1,
  ai2:         DEFAULT_AI2,
  running:     false,
  stopped:     false,
  controller:  null,
  activeCard:  null,
};

/* ── DOM refs ────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ── Initialise ──────────────────────────────────────────────── */
function init() {
  renderAIPicker('picker1', 1);
  renderAIPicker('picker2', 2);
  updatePipeline();
  $('askBtn').addEventListener('click', handleAsk);
  $('stopBtn').addEventListener('click', handleStop);
  $('questionInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  });
  $('questionInput').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
}

/* ── AI Picker ───────────────────────────────────────────────── */
function renderAIPicker(containerId, slot) {
  const container = $(containerId);
  container.innerHTML = '';
  const current = slot === 1 ? state.ai1 : state.ai2;
  const other   = slot === 1 ? state.ai2 : state.ai1;

  AI_LIST.forEach(ai => {
    const isSelected  = ai.id === current;
    const isDisabled  = ai.id === other;

    const el = document.createElement('div');
    el.className = `ai-option${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`;
    el.dataset.aiId = ai.id;
    el.setAttribute('role', 'radio');
    el.setAttribute('aria-checked', isSelected);
    el.setAttribute('tabindex', isDisabled ? '-1' : '0');

    el.innerHTML = `
      <div class="ai-option-avatar ${ai.cssClass}">${ai.initial}</div>
      <div class="ai-option-info">
        <div class="ai-option-name">${ai.name}</div>
        <div class="ai-option-tag">${ai.tag}</div>
      </div>
      <div class="ai-option-check"></div>
    `;

    el.addEventListener('click', () => {
      if (isDisabled || state.running) return;
      if (slot === 1) state.ai1 = ai.id;
      else            state.ai2 = ai.id;
      renderAIPicker('picker1', 1);
      renderAIPicker('picker2', 2);
      updatePipeline();
    });

    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });

    container.appendChild(el);
  });
}

/* ── Pipeline ─────────────────────────────────────────────────── */
function updatePipeline() {
  const ai1 = AI_MODELS[state.ai1];
  const ai2 = AI_MODELS[state.ai2];

  $('pipeAI1Dot').className   = `pipeline-dot ${ai1.cssClass}`;
  $('pipeAI1Dot').textContent = ai1.initial;
  $('pipeAI1Label').innerHTML = `<strong>${ai1.name}</strong>drafts`;

  $('pipeAI2Dot').className   = `pipeline-dot ${ai2.cssClass}`;
  $('pipeAI2Dot').textContent = ai2.initial;
  $('pipeAI2Label').innerHTML = `<strong>${ai2.name}</strong>refines`;
}

function setPipelineActive(step) {
  // step: 1, 2, 3, or null
  ['pipeAI1Dot', 'pipeAI2Dot', 'pipeFinalDot'].forEach((id, i) => {
    const el = $(id);
    if (el) el.classList.toggle('active', i + 1 === step);
  });
}

/* ── Running state ────────────────────────────────────────────── */
function setRunning(isRunning) {
  state.running = isRunning;
  $('askBtn').style.display  = isRunning ? 'none' : 'inline-flex';
  $('stopBtn').style.display = isRunning ? 'inline-flex' : 'none';
  $('questionInput').disabled = isRunning;

  // Disable pickers while running
  document.querySelectorAll('.ai-option').forEach(el => {
    el.classList.toggle('disabled', isRunning);
  });

  if (!isRunning) setPipelineActive(null);
}

/* ── Ask handler ──────────────────────────────────────────────── */
async function handleAsk() {
  if (state.running) return;

  const q = $('questionInput').value.trim();
  if (!q) {
    $('questionInput').style.boxShadow = '0 0 0 3px rgba(239,68,68,0.25)';
    $('questionInput').style.borderColor = 'var(--danger)';
    setTimeout(() => {
      $('questionInput').style.boxShadow = '';
      $('questionInput').style.borderColor = '';
    }, 1500);
    return;
  }

  // Validate — must be different AIs
  if (state.ai1 === state.ai2) {
    showValidationError('Please select two different AIs.');
    return;
  }

  hideValidationError();
  state.stopped = false;
  state.controller = new AbortController();
  setRunning(true);

  $('examplesRow').style.display = 'none';
  $('results').innerHTML = '';

  const ai1 = AI_MODELS[state.ai1];
  const ai2 = AI_MODELS[state.ai2];
  const sig = state.controller.signal;

  try {
    // ── Step 1: AI 1 drafts ───────────────────────────────────
    setPipelineActive(1);
    const card1 = createStepCard(ai1, 'Step 1 of 3', 'Drafting initial answer…', 1);
    $('results').appendChild(card1);
    state.activeCard = card1;

    const draft = await draftAnswer(state.ai1, q, sig);
    if (state.stopped) return;

    completeStepCard(card1, draft, ai1.cssClass, 'Step 1 of 3', 'Initial draft');

    // ── Step 2: AI 2 refines ──────────────────────────────────
    setPipelineActive(2);
    const card2 = createStepCard(ai2, 'Step 2 of 3', 'Reviewing and improving…', 2);
    $('results').appendChild(card2);
    state.activeCard = card2;

    const refined = await refineAnswer(state.ai2, q, draft, sig);
    if (state.stopped) return;

    completeStepCard(card2, refined, ai2.cssClass, 'Step 2 of 3', 'Refined answer');

    // ── Step 3: AI 1 synthesises ──────────────────────────────
    setPipelineActive(3);
    const card3 = createStepCard(ai1, 'Step 3 of 3', 'Synthesising final answer…', 3);
    $('results').appendChild(card3);
    state.activeCard = card3;

    const final = await synthesiseAnswer(state.ai1, q, draft, refined, sig);
    if (state.stopped) return;

    card3.style.display = 'none'; // hide synthesis step — show as final card instead
    state.activeCard = null;

    showFinalCard(final, ai1, ai2);

  } catch (err) {
    if (state.stopped || err?.name === 'AbortError') return;
    markActiveCardError();
    state.activeCard = null;
    showErrorBanner(err);
  }

  setRunning(false);
  state.activeCard = null;
}

/* ── Stop handler ─────────────────────────────────────────────── */
function handleStop() {
  if (!state.running) return;
  state.stopped = true;
  if (state.controller) state.controller.abort();
  markActiveCardStopped();
  state.activeCard = null;
  showStoppedBanner();
  setRunning(false);
}

/* ── Step card builders ───────────────────────────────────────── */
function createStepCard(ai, stepLabel, desc, stepNum) {
  const card = document.createElement('div');
  card.className = 'step-card';
  card.dataset.step = stepNum;

  card.innerHTML = `
    <div class="step-header" onclick="toggleStepBody(this)">
      <div class="step-header-left">
        <div class="ai-avatar ${ai.cssClass}">${ai.initial}</div>
        <div class="step-meta">
          <div class="step-title">
            ${ai.name}
            <span class="badge badge-thinking">
              <span class="dot-loader"><span></span><span></span><span></span></span>
              Thinking
            </span>
          </div>
          <div class="step-description">${stepLabel} · ${desc}</div>
        </div>
      </div>
      <div class="step-header-right">
        <svg class="chevron open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </div>
    </div>
    <div class="step-body ${ai.cssClass}-body open">
      <div class="dot-loader" style="padding: 4px 0">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  return card;
}

function completeStepCard(card, text, cssClass, stepLabel, desc) {
  const badge = card.querySelector('.badge');
  badge.className = 'badge badge-done';
  badge.innerHTML = `
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Done
  `;

  const body = card.querySelector('.step-body');
  body.textContent = text;
  body.classList.add('open');

  const aiName = card.querySelector('.step-title');
  // Keep just the AI name + new badge (replace children)
  const nameText = aiName.childNodes[0].textContent.trim();
  aiName.innerHTML = `${nameText} ${badge.outerHTML}`;

  card.querySelector('.step-description').textContent = `${stepLabel} · ${desc}`;

  // Auto-collapse after a short delay to keep UI clean
  setTimeout(() => {
    const header = card.querySelector('.step-header');
    const b = card.querySelector('.step-body');
    const chev = card.querySelector('.chevron');
    b.classList.remove('open');
    chev.classList.remove('open');
    header.classList.remove('open');
  }, 2200);
}

function markActiveCardStopped() {
  const card = state.activeCard;
  if (!card) return;
  const badge = card.querySelector('.badge');
  if (badge) { badge.className = 'badge badge-stopped'; badge.textContent = 'Stopped'; }
  const body = card.querySelector('.step-body');
  if (body) { body.textContent = 'Stopped before this step completed.'; body.classList.add('open'); }
}

function markActiveCardError() {
  const card = state.activeCard;
  if (!card) return;
  const badge = card.querySelector('.badge');
  if (badge) { badge.className = 'badge badge-error'; badge.textContent = 'Error'; }
  const body = card.querySelector('.step-body');
  if (body) { body.textContent = 'This step failed. See the error below.'; body.classList.add('open'); }
}

/* ── Final card ──────────────────────────────────────────────── */
function showFinalCard(text, ai1, ai2) {
  const card = document.createElement('div');
  card.className = 'final-card';
  card.innerHTML = `
    <div class="final-header">
      <div class="final-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div>
        <div class="final-title">Combined Answer</div>
        <div class="final-subtitle">${ai1.name} drafted · ${ai2.name} refined · ${ai1.name} synthesised</div>
      </div>
    </div>
    <div class="final-body">${escapeHtml(text)}</div>
    <div class="final-footer">
      <span class="final-meta">Powered by ${ai1.name} + ${ai2.name}</span>
      <button class="btn btn-ghost btn-sm" onclick="resetUI()">New question →</button>
    </div>
  `;
  $('results').appendChild(card);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Banners ─────────────────────────────────────────────────── */
function showStoppedBanner() {
  const b = document.createElement('div');
  b.className = 'banner banner-warning';
  b.innerHTML = `
    <div class="banner-icon">⏹</div>
    <div class="banner-content">
      <div class="banner-title">Stopped</div>
      <div class="banner-desc">You stopped the process. The answer is incomplete.</div>
      <div class="banner-actions">
        <button class="btn btn-secondary btn-sm" onclick="retryQuestion()">Try again</button>
        <button class="btn btn-ghost btn-sm" onclick="resetUI()">New question</button>
      </div>
    </div>
  `;
  $('results').appendChild(b);
  b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showErrorBanner(err) {
  const title = err?.title || 'Something went wrong';
  const desc  = err?.message || 'An unexpected error occurred.';

  const b = document.createElement('div');
  b.className = 'banner banner-error';
  b.innerHTML = `
    <div class="banner-icon">⚠</div>
    <div class="banner-content">
      <div class="banner-title">${escapeHtml(title)}</div>
      <div class="banner-desc">${escapeHtml(desc)}</div>
      <div class="banner-actions">
        <button class="btn btn-secondary btn-sm" onclick="retryQuestion()">Try again</button>
        <button class="btn btn-ghost btn-sm" onclick="resetUI()">New question</button>
      </div>
    </div>
  `;
  $('results').appendChild(b);
  b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Validation ──────────────────────────────────────────────── */
function showValidationError(msg) {
  const el = $('selectorError');
  if (el) { el.textContent = msg; el.classList.add('visible'); }
}
function hideValidationError() {
  const el = $('selectorError');
  if (el) el.classList.remove('visible');
}

/* ── Toggle step body ─────────────────────────────────────────── */
function toggleStepBody(header) {
  const body   = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  const isOpen  = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  chevron.classList.toggle('open', !isOpen);
}

/* ── Helpers ──────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function setExample(el) {
  $('questionInput').value = el.textContent;
  $('questionInput').style.height = 'auto';
  $('questionInput').style.height = $('questionInput').scrollHeight + 'px';
}

function retryQuestion() {
  state.stopped = false;
  handleAsk();
}

function resetUI() {
  $('results').innerHTML = '';
  $('questionInput').value = '';
  $('questionInput').style.height = 'auto';
  $('examplesRow').style.display = 'flex';
  setRunning(false);
  state.stopped = false;
  state.activeCard = null;
  hideValidationError();
}

/* ── Boot ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
